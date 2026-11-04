import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles, Stars, useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Lock, Orbit } from "lucide-react";
import type { OrbitLayoutItem, Sector, SectorProgress, SectorStatus } from "../game/types";
import { getSector } from "../game/sectors";

type OrbitSceneProps = {
  activeIndex: number;
  progress: Record<number, SectorProgress>;
  focusedIndex: number | null;
  showLabels: boolean;
  celebratingIndex: number | null;
  onOpenSector: (index: number) => void;
  onLockedSector: (index: number) => void;
  reducedMotion: boolean;
};

type PlanetSceneProps = {
  sector: Sector;
  status: SectorStatus;
  layout: OrbitLayoutItem;
  showLabels: boolean;
  compact: boolean;
  celebrating: boolean;
  reducedMotion: boolean;
  onOpen: (index: number) => void;
  onLocked: (index: number) => void;
};

const DESKTOP_LAYOUT: OrbitLayoutItem[] = [
  { position: [-1.0, 0.05, 0.2], radius: 1.45 },
  { position: [3.0, 0.55, -1.4], radius: 1.05 },
  { position: [5.35, -0.1, -2.9], radius: 0.9 },
];

const COMPACT_LAYOUT: OrbitLayoutItem[] = [
  { position: [-0.15, 1.15, 0.2], radius: 0.78 },
  { position: [0.9, -1.4, -0.9], radius: 0.55 },
  { position: [-0.4, -2.8, -1.7], radius: 0.42 },
];

const DESKTOP_CAMERA = {
  position: [1.2, 1.6, 12.6] as [number, number, number],
  target: [1.2, 0.6, -0.5] as [number, number, number],
};

const COMPACT_CAMERA = {
  position: [0.08, 0.45, 10.8] as [number, number, number],
  target: [0.08, -0.55, -0.5] as [number, number, number],
};

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-modelViewPosition.xyz);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vViewDirection)), 3.2);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

let cachedGlowTexture: THREE.CanvasTexture | null = null;

function getGlowTexture(): THREE.CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  cachedGlowTexture = new THREE.CanvasTexture(canvas);
  cachedGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return cachedGlowTexture;
}

function CameraRig({
  focusIndex,
  layout,
  compact,
  activeIndex,
  allCleared,
  reducedMotion,
}: {
  focusIndex: number | null;
  layout: OrbitLayoutItem[];
  compact: boolean;
  activeIndex: number;
  allCleared: boolean;
  reducedMotion: boolean;
}) {
  const { camera, pointer } = useThree();
  const cameraState = compact ? COMPACT_CAMERA : DESKTOP_CAMERA;
  const currentTarget = useRef(new THREE.Vector3(...cameraState.target));
  const desiredPosition = useRef(new THREE.Vector3(...cameraState.position));
  const desiredTarget = useRef(new THREE.Vector3(...cameraState.target));

  useFrame((_state, delta) => {
    const focus = focusIndex === null ? null : layout[focusIndex - 1];
    if (focus) {
      const [x, y, z] = focus.position;
      const distance = compact
        ? focus.radius * 2.8 + 2
        : focus.radius * 3.05 + 2.25;
      desiredPosition.current.set(x, y + 0.32, z + distance);
      desiredTarget.current.set(x, y, z);
    } else if (compact) {
      desiredPosition.current.set(
        cameraState.position[0] + pointer.x * 0.04,
        cameraState.position[1] + pointer.y * 0.02,
        cameraState.position[2],
      );
      desiredTarget.current.set(...cameraState.target);
    } else if (!allCleared) {
      const [x, , z] = layout[activeIndex - 1].position;
      desiredPosition.current.set(
        x + pointer.x * 0.12,
        1.65 + pointer.y * 0.08,
        z + 12.4,
      );
      desiredTarget.current.set(x, 0.58, z);
    } else {
      desiredPosition.current.set(2.0 + pointer.x * 0.16, 1.7, 14.4);
      desiredTarget.current.set(2.0, 0.52, -0.7);
    }

    const damping = reducedMotion ? 14 : 3.4;
    const alpha = 1 - Math.exp(-damping * Math.min(delta, 0.1));
    camera.position.lerp(desiredPosition.current, alpha);
    currentTarget.current.lerp(desiredTarget.current, alpha);
    camera.lookAt(currentTarget.current);
  });

  return null;
}

function Atmosphere({
  radius,
  color,
  strength,
  reducedMotion,
}: {
  radius: number;
  color: string;
  strength: number;
  reducedMotion: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: strength },
    }),
    [color, strength],
  );

  useFrame((state, delta) => {
    if (!material.current) return;
    const pulse = reducedMotion
      ? 1
      : 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.08;
    material.current.uniforms.uIntensity.value = THREE.MathUtils.damp(
      material.current.uniforms.uIntensity.value,
      strength * pulse,
      3,
      Math.min(delta, 0.1),
    );
  });

  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={material}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function ActiveReticle({
  radius,
  color,
  reducedMotion,
}: {
  radius: number;
  color: string;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reducedMotion) {
      group.current.rotation.z += delta * 0.11;
    }
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.018;
    group.current.scale.setScalar(pulse);
  });

  return (
    <group ref={group} rotation={[1.18, 0.18, 0]}>
      <mesh>
        <ringGeometry args={[radius * 1.38, radius * 1.395, 96, 1, 0, Math.PI * 0.62]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI]}>
        <ringGeometry args={[radius * 1.38, radius * 1.395, 96, 1, 0, Math.PI * 0.34]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ClearedRing({
  radius,
  color,
  reducedMotion,
}: {
  radius: number;
  color: string;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const entry = reducedMotion ? 1 : THREE.MathUtils.damp(group.current.scale.x, 1, 4, delta);
    group.current.scale.setScalar(entry);
    if (orbit.current && !reducedMotion) {
      orbit.current.rotation.y += delta * 0.35;
    }
    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
    group.current.position.y = bob;
  });

  return (
    <group ref={group} rotation={[1.2, 0.08, 0]} scale={0.001}>
      <mesh>
        <ringGeometry args={[radius * 1.48, radius * 1.525, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[0, 0, 0.14]}>
        <ringGeometry args={[radius * 1.72, radius * 1.735, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <group ref={orbit}>
        <mesh position={[radius * 1.73, 0, 0]}>
          <sphereGeometry args={[radius * 0.045, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}

function Planet({
  sector,
  status,
  layout,
  showLabels,
  compact,
  celebrating,
  reducedMotion,
  onOpen,
  onLocked,
}: PlanetSceneProps) {
  const texture = useTexture(sector.texture);
  const [hovered, setHovered] = useState(false);
  const outer = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  useCursor(hovered);

  const targetColor = useMemo(
    () =>
      new THREE.Color(
        status === "locked" ? "#7e899d" : sector.textureTint,
      ),
    [sector.textureTint, status],
  );

  useFrame((state, delta) => {
    if (!outer.current) return;
    const baseScale =
      status === "active" ? 1.15 : status === "cleared" ? 0.58 : 0.6;
    const hoverFactor = hovered ? (status === "locked" ? 1.035 : 1.07) : 1;
    const targetScale = baseScale * hoverFactor;
    const alpha = 1 - Math.exp(-5 * Math.min(delta, 0.1));
    const next = THREE.MathUtils.lerp(outer.current.scale.x, targetScale, alpha);
    outer.current.scale.setScalar(next);

    if (!reducedMotion) {
      outer.current.position.y =
        layout.position[1] +
        Math.sin(state.clock.elapsedTime * 0.7 + sector.index * 1.8) *
          (status === "active" ? 0.055 : 0.025);
    }

    if (spinner.current && !reducedMotion) {
      spinner.current.rotation.y +=
        delta * (status === "active" ? 0.075 : status === "cleared" ? 0.045 : 0.022);
    }

    if (material.current) {
      material.current.color.lerp(targetColor, alpha);
      const targetEmissive =
        status === "active" ? 0.12 : status === "cleared" ? 0.07 : 0.025;
      material.current.emissiveIntensity = THREE.MathUtils.lerp(
        material.current.emissiveIntensity,
        targetEmissive,
        alpha,
      );
    }

    if (halo.current) {
      const targetOpacity =
        status === "active" ? 0.34 : status === "cleared" ? 0.17 : 0.055;
      halo.current.opacity = THREE.MathUtils.lerp(
        halo.current.opacity,
        targetOpacity,
        alpha,
      );
    }
  });

  function handleSelect() {
    if (status === "locked") {
      onLocked(sector.index);
      return;
    }
    onOpen(sector.index);
  }

  const label = (
    <button
      type="button"
      className={`planet-tag is-${status} ${hovered ? "is-hovered" : ""}`}
      onClick={handleSelect}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      aria-label={
        status === "locked"
          ? `Sector ${sector.index} ${sector.codename} locked. Clear the previous sector first.`
          : `Open sector ${sector.index} ${sector.codename}`
      }
      data-testid={`planet-label-${sector.index}`}
    >
      <span className="planet-tag-topline">
        <span className="planet-tag-index">SECTOR 0{sector.index}</span>
        <span className="planet-tag-state">
          {status === "locked" ? (
            <>
              <Lock size={10} strokeWidth={2.2} /> LOCKED
            </>
          ) : status === "active" ? (
            <>
              <Orbit size={10} strokeWidth={2.2} /> OPEN
            </>
          ) : (
            "CLEARED"
          )}
        </span>
      </span>
      <span className="planet-tag-name">{sector.codename}</span>
      <span className="planet-tag-topic">{sector.shortTitle}</span>
      <span className="planet-tag-action">
        {status === "locked"
          ? `CLEAR SECTOR 0${sector.index - 1}`
          : status === "active"
            ? "OPEN SIGNAL"
            : "REVIEW ARCHIVE"}
      </span>
    </button>
  );

  return (
    <group
      ref={outer}
      position={layout.position}
      rotation={[0.08, -0.12, -0.08]}
    >
      <sprite scale={[layout.radius * 5.4, layout.radius * 5.4, 1]} position={[0, 0, -0.3]}>
        <spriteMaterial
          ref={halo}
          map={glowTexture}
          color={sector.atmosphere}
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <group ref={spinner}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            handleSelect();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[layout.radius, 64, 64]} />
          <meshStandardMaterial
            ref={material}
            map={texture}
            color={sector.textureTint}
            emissive={sector.atmosphere}
            emissiveMap={texture}
            emissiveIntensity={0.08}
            roughness={0.82}
            metalness={0.08}
          />
        </mesh>
        <Atmosphere
          radius={layout.radius}
          color={sector.atmosphere}
          strength={
            status === "active" ? 0.9 : status === "cleared" ? 0.48 : 0.18
          }
          reducedMotion={reducedMotion}
        />
      </group>

      {status === "active" && !compact ? (
        <ActiveReticle
          radius={layout.radius}
          color={sector.accent}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {status === "cleared" ? (
        <ClearedRing
          radius={layout.radius}
          color={sector.accent}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {status === "locked" && showLabels && !compact ? (
        <Html
          center
          position={[0, layout.radius * 1.25 + 0.35, 0]}
          zIndexRange={[6, 2]}
          style={{ pointerEvents: "none" }}
        >
          <span className="lock-marker" aria-hidden="true">
            <Lock size={12} strokeWidth={2.2} />
            LOCKED
          </span>
        </Html>
      ) : null}

      {celebrating ? (
        <Sparkles
          count={80}
          scale={[layout.radius * 4.2, layout.radius * 3.4, layout.radius * 4.2]}
          size={4.5}
          speed={1.4}
          opacity={0.9}
          color={sector.atmosphere}
          noise={0.8}
        />
      ) : null}

      {showLabels ? (
        <Html
          center
          position={[
            0,
            compact
              ? -layout.radius * 1.02 - 0.22
              : -layout.radius * 1.08 - 0.58,
            0,
          ]}
          zIndexRange={[6, 2]}
          style={{ pointerEvents: "auto" }}
        >
          {label}
        </Html>
      ) : null}
    </group>
  );
}

function PathDots({
  from,
  to,
  pathState,
  color,
  reducedMotion,
}: {
  from: OrbitLayoutItem;
  to: OrbitLayoutItem;
  pathState: "locked" | "lit";
  color: string;
  reducedMotion: boolean;
}) {
  const pointsMaterial = useRef<THREE.PointsMaterial>(null);
  const comet = useRef<THREE.Group>(null);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  const { curve, positions } = useMemo(() => {
    const start = new THREE.Vector3(...from.position);
    const end = new THREE.Vector3(...to.position);
    const direction = end.clone().sub(start).normalize();
    const startPoint = start
      .clone()
      .add(direction.clone().multiplyScalar(from.radius * 1.2));
    const endPoint = end
      .clone()
      .sub(direction.clone().multiplyScalar(to.radius * 1.35));
    const midPoint = startPoint
      .clone()
      .add(endPoint)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0.25, 0.55, 0.7));
    const pathCurve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
    const dotCount = 34;
    const points = new Float32Array(dotCount * 3);
    for (let index = 0; index < dotCount; index += 1) {
      const point = pathCurve.getPoint(index / (dotCount - 1));
      points[index * 3] = point.x;
      points[index * 3 + 1] = point.y;
      points[index * 3 + 2] = point.z;
    }
    return { curve: pathCurve, positions: points };
  }, [from, to]);

  useFrame((state) => {
    if (pointsMaterial.current && !reducedMotion) {
      const pulse = 0.82 + Math.sin(state.clock.elapsedTime * 1.4) * 0.18;
      pointsMaterial.current.opacity = (pathState === "locked" ? 0.5 : 0.95) * pulse;
    }
    if (comet.current && pathState === "lit" && !reducedMotion) {
      const progress = (state.clock.elapsedTime * 0.11) % 1;
      const point = curve.getPoint(progress);
      comet.current.position.copy(point);
      comet.current.visible = true;
    }
  });

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMaterial}
          map={glowTexture}
          color={color}
          size={pathState === "lit" ? 0.3 : 0.21}
          transparent
          opacity={pathState === "lit" ? 0.95 : 0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={pathState === "lit" ? 0.075 : 0.055}
          transparent
          opacity={pathState === "lit" ? 0.95 : 0.65}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <group ref={comet} visible={false}>
        <sprite scale={[0.34, 0.34, 1]}>
          <spriteMaterial
            map={glowTexture}
            color={color}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>
    </group>
  );
}

function SceneContent({
  activeIndex,
  progress,
  focusedIndex,
  showLabels,
  celebratingIndex,
  onOpenSector,
  onLockedSector,
  reducedMotion,
}: OrbitSceneProps) {
  const { size } = useThree();
  const compact = size.width < 820;
  const layout = compact ? COMPACT_LAYOUT : DESKTOP_LAYOUT;

  function statusFor(index: number): SectorStatus {
    if (progress[index]?.status === "cleared") return "cleared";
    if (index === activeIndex) return "active";
    return "locked";
  }

  return (
    <>
      <CameraRig
        focusIndex={focusedIndex}
        layout={layout}
        compact={compact}
        activeIndex={activeIndex}
        allCleared={progress[1]?.status === "cleared" && progress[2]?.status === "cleared" && progress[3]?.status === "cleared"}
        reducedMotion={reducedMotion}
      />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#8fd5ff", "#170b26", 1.15]} />
      <directionalLight
        position={[5.5, 7.5, 7]}
        intensity={2.7}
        color="#fff0d6"
      />
      <directionalLight
        position={[-7, -3, 4]}
        intensity={1.15}
        color="#6c7dff"
      />
      <Stars
        radius={90}
        depth={55}
        count={5200}
        factor={4.2}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.28}
      />
      <Sparkles
        count={reducedMotion ? 12 : 42}
        scale={[16, 8, 8]}
        position={[0.8, 0.3, -2.4]}
        size={2.1}
        speed={reducedMotion ? 0 : 0.28}
        opacity={0.34}
        color="#d8e9ff"
        noise={0.7}
      />

      <PathDots
        from={layout[0]}
        to={layout[1]}
        pathState={progress[1]?.status === "cleared" ? "lit" : "locked"}
        color={progress[1]?.status === "cleared" ? "#7dffdd" : "#93b3ff"}
        reducedMotion={reducedMotion}
      />
      <PathDots
        from={layout[1]}
        to={layout[2]}
        pathState={progress[2]?.status === "cleared" ? "lit" : "locked"}
        color={progress[2]?.status === "cleared" ? "#ffd08a" : "#93b3ff"}
        reducedMotion={reducedMotion}
      />

      {([1, 2, 3] as const).map((index) => {
        const sector = getSector(index);
        return (
          <Planet
            key={sector.index}
            sector={sector}
            status={statusFor(index)}
            layout={layout[index - 1]}
            showLabels={showLabels}
            compact={compact}
            celebrating={celebratingIndex === index}
            reducedMotion={reducedMotion}
            onOpen={onOpenSector}
            onLocked={onLockedSector}
          />
        );
      })}
    </>
  );
}

export function OrbitScene(props: OrbitSceneProps) {
  return (
    <div className="orbit-canvas" data-testid="orbit-canvas">
      <Canvas
        dpr={[1, 1.65]}
        camera={{ position: DESKTOP_CAMERA.position, fov: 40, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
