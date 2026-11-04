import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Sparkles, Stars, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { Lock } from "lucide-react";
import { PLANETS, type PlanetDef } from "../game/conquest";

export type SceneMode = "galaxy" | "conquest" | "impact";

type GalaxySceneProps = {
  mode: SceneMode;
  conquered: boolean;
  agentUnlocked: boolean;
  impactActive: boolean;
  reducedMotion: boolean;
  onOpenXylos: () => void;
  onLockedPlanet: (planet: PlanetDef) => void;
};

type ScenePlanet = {
  planet: PlanetDef;
  position: [number, number, number];
};

const DESKTOP_POSITIONS: [number, number, number][] = [
  [0.1, 0.2, 0.2],
  [1.8, 1.25, -0.2],
  [3.2, 1.0, -0.5],
  [4.3, 0.2, -0.8],
  [4.7, -0.9, -1.1],
  [4.0, -1.9, -1.4],
  [2.7, -2.5, -1.7],
  [1.2, -2.4, -1.4],
  [-0.3, -1.6, -1.1],
  [-1.5, -0.6, -0.8],
  [-1.6, 0.6, -1.0],
  [-0.6, 1.65, -1.3],
];

const COMPACT_POSITIONS: [number, number, number][] = DESKTOP_POSITIONS.map(
  ([x, y, z]) => [x * 0.44, y * 0.68 + 0.2, z * 0.8],
);

const LABEL_SIDES: Record<number, "under" | "above" | "left" | "right"> = {
  2: "under",
  3: "under",
  4: "right",
  5: "right",
  6: "under",
  7: "under",
  8: "under",
  9: "under",
  10: "left",
  11: "above",
  12: "above",
};

type PlanetLabelLayout = {
  planet: PlanetDef;
  left: number;
  top: number;
  side: "under" | "above" | "left" | "right";
};

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

function PlanetLabels({
  mode,
  onLockedPlanet,
}: {
  mode: SceneMode;
  onLockedPlanet: (planet: PlanetDef) => void;
}) {
  const viewport = useViewportSize();

  const labels = useMemo<PlanetLabelLayout[]>(() => {
    if (viewport.width < 820) return [];
    const camera = new THREE.PerspectiveCamera(
      40,
      viewport.width / viewport.height,
      0.1,
      160,
    );
    camera.position.set(...DESKTOP_CAMERA.position);
    camera.lookAt(new THREE.Vector3(...DESKTOP_CAMERA.target));
    camera.updateMatrixWorld();

    return PLANETS.filter((planet) => planet.locked).map((planet) => {
      const position = new THREE.Vector3(
        ...DESKTOP_POSITIONS[planet.id - 1],
      );
      const projected = position.clone().project(camera);
      const left = (projected.x * 0.5 + 0.5) * viewport.width;
      const top = (-projected.y * 0.5 + 0.5) * viewport.height;
      const distance = camera.position.distanceTo(position);
      const radius =
        (planet.size * 0.82 * viewport.height) /
        (2 * distance * Math.tan(THREE.MathUtils.degToRad(20)));
      const side = LABEL_SIDES[planet.id] ?? "under";
      let labelLeft = left;
      let labelTop = top;
      if (side === "above") {
        labelTop = top - radius - 9;
      } else if (side === "right") {
        labelLeft = left + radius + 10;
      } else if (side === "left") {
        labelLeft = left - radius - 10;
      } else {
        labelTop = top + radius + 8;
      }
      return { planet, left: labelLeft, top: labelTop, side };
    });
  }, [viewport.width, viewport.height]);

  if (mode !== "galaxy" || labels.length === 0) return null;

  return (
    <div className="planet-label-layer" aria-label="Sealed planets">
      {labels.map(({ planet, left, top, side }) => (
        <div
          key={planet.id}
          className={`planet-label side-${side}`}
          style={{ left, top }}
        >
          <button
            type="button"
            className="planet-tag is-locked"
            style={
              {
                "--tag-color": planet.halo,
                "--tag-ring": planet.ring,
              } as React.CSSProperties
            }
            onClick={() => onLockedPlanet(planet)}
            data-testid={`planet-label-${planet.id}`}
            aria-label={`Planet ${planet.id} ${planet.name} is sealed.`}
          >
            <span className="planet-tag-top mono">
              <Lock size={9} />
              SEALED
            </span>
            <span className="planet-tag-name">
              <span className="planet-tag-index mono">
                {String(planet.id).padStart(2, "0")}
              </span>
              {planet.name}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

const DESKTOP_CAMERA = {
  position: [1.0, 1.9, 15.5] as [number, number, number],
  target: [1.0, 0.2, -1.0] as [number, number, number],
};

const COMPACT_CAMERA = {
  position: [0, 1.4, 13.6] as [number, number, number],
  target: [0, 0.15, -0.7] as [number, number, number],
};

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-modelViewPosition.xyz);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.6);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

let glowTextureCache: THREE.CanvasTexture | null = null;
let toonGradientCache: THREE.DataTexture | null = null;

function getGlowTexture(): THREE.CanvasTexture {
  if (glowTextureCache) return glowTextureCache;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.24)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  glowTextureCache = new THREE.CanvasTexture(canvas);
  glowTextureCache.colorSpace = THREE.SRGBColorSpace;
  return glowTextureCache;
}

function getToonGradient(): THREE.DataTexture {
  if (toonGradientCache) return toonGradientCache;
  const steps = new Uint8Array([26, 88, 162, 255]);
  const texture = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  toonGradientCache = texture;
  return texture;
}

function mixHex(a: string, b: string, amount: number): THREE.Color {
  return new THREE.Color(a).lerp(new THREE.Color(b), amount);
}

function CameraRig({
  mode,
  compact,
  reducedMotion,
}: {
  mode: SceneMode;
  compact: boolean;
  reducedMotion: boolean;
}) {
  const { camera, pointer } = useThree();
  const base = compact ? COMPACT_CAMERA : DESKTOP_CAMERA;
  const target = useRef(new THREE.Vector3(...base.target));

  useFrame((state, delta) => {
    const clock = state.clock.elapsedTime;
    let desiredX: number;
    let desiredY: number;
    let desiredZ: number;
    let targetX: number;
    let targetY: number;
    let targetZ: number;
    let damping = 2.8;

    if (mode === "galaxy") {
      const drift = reducedMotion ? 0 : 1;
      desiredX = base.position[0] + Math.sin(clock * 0.32) * 0.1 * drift + pointer.x * 0.36;
      desiredY = base.position[1] + Math.sin(clock * 0.22) * 0.06 * drift + pointer.y * 0.22;
      desiredZ = base.position[2];
      targetX = base.target[0] + pointer.x * 0.12;
      targetY = base.target[1] + pointer.y * 0.08;
      targetZ = base.target[2];
    } else if (mode === "conquest") {
      const [x, y, z] = DESKTOP_POSITIONS[0];
      const offsetX = compact ? 0 : 2.4;
      desiredX = x + offsetX;
      desiredY = y + 1.0;
      desiredZ = z + 9.4;
      targetX = x + offsetX;
      targetY = y;
      targetZ = z;
      damping = 3.3;
    } else {
      const [x, y, z] = DESKTOP_POSITIONS[0];
      const shake = reducedMotion ? 0 : 1;
      desiredX = x + Math.sin(clock * 37) * 0.045 * shake;
      desiredY = y + 0.55 + Math.sin(clock * 31) * 0.03 * shake;
      desiredZ = z + 7.2;
      targetX = x;
      targetY = y;
      targetZ = z;
      damping = 3.8;
    }

    const alpha = 1 - Math.exp(-damping * Math.min(delta, 0.1));
    camera.position.lerp(new THREE.Vector3(desiredX, desiredY, desiredZ), alpha);
    target.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), alpha);
    camera.lookAt(target.current);
  });

  return null;
}

function Atmosphere({
  radius,
  color,
  strength,
}: {
  radius: number;
  color: string;
  strength: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: strength },
    }),
    [color, strength],
  );

  useFrame((_state, delta) => {
    if (!material.current) return;
    material.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      material.current.uniforms.uIntensity.value,
      strength,
      1 - Math.exp(-3 * delta),
    );
  });

  return (
    <mesh scale={1.14}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        ref={material}
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

type SurfaceSpot = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  size: number;
  dark: boolean;
};

function buildSpots(planet: PlanetDef): SurfaceSpot[] {
  let seed = planet.id * 977 + 31;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  return Array.from({ length: 5 }, (_, index) => {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const normal = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    );
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const size = planet.size * (0.08 + random() * 0.16);
    return {
      position: normal.clone().multiplyScalar(planet.size * 1.006).toArray() as [
        number,
        number,
        number,
      ],
      quaternion: quaternion.toArray() as [number, number, number, number],
      size,
      dark: index % 2 === 0,
    };
  });
}

function PlanetRings({
  planet,
  active,
  locked,
  reducedMotion,
}: {
  planet: PlanetDef;
  active: boolean;
  locked: boolean;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const baseScale = active ? 1 : planet.size / 1.35;

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reducedMotion) {
      group.current.rotation.z += delta * (active ? 0.1 : 0.035);
    }
    const pulse =
      1 + (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.7 + planet.id) * 0.018);
    group.current.scale.setScalar(pulse * baseScale);
    if (ringMaterial.current) {
      ringMaterial.current.opacity = locked ? 0.22 : active ? 0.58 : 0.34;
    }
    if (edgeMaterial.current) {
      edgeMaterial.current.opacity = locked ? 0.32 : active ? 0.9 : 0.48;
    }
  });

  return (
    <group ref={group} rotation={[1.16, 0.16, 0.2]}>
      <mesh>
        <ringGeometry args={[planet.size * 1.52, planet.size * 2.02, 72]} />
        <meshBasicMaterial
          ref={ringMaterial}
          color={planet.ring}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[0, 0, 0.08]}>
        <ringGeometry args={[planet.size * 2.06, planet.size * 2.11, 72]} />
        <meshBasicMaterial
          ref={edgeMaterial}
          color={planet.halo}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function MoonSystem({
  planet,
  reducedMotion,
}: {
  planet: PlanetDef;
  reducedMotion: boolean;
}) {
  const orbit = useRef<THREE.Group>(null);
  const secondOrbit = useRef<THREE.Group>(null);
  const radius = planet.size * 2.55;

  useFrame((_state, delta) => {
    if (reducedMotion) return;
    if (orbit.current) orbit.current.rotation.y += delta * (0.18 + planet.id * 0.001);
    if (secondOrbit.current) secondOrbit.current.rotation.y -= delta * 0.12;
  });

  return (
    <>
      <group ref={orbit} rotation={[0.65, 0.2, 0.1]}>
        <mesh position={[radius, 0, 0]}>
          <icosahedronGeometry args={[planet.size * 0.11, 1]} />
          <meshBasicMaterial color={planet.moon} />
        </mesh>
      </group>
      {planet.id % 2 === 0 ? (
        <group ref={secondOrbit} rotation={[-0.35, 0.5, -0.2]}>
          <mesh position={[radius * 0.73, 0, 0]}>
            <octahedronGeometry args={[planet.size * 0.07, 0]} />
            <meshBasicMaterial color={planet.ring} />
          </mesh>
        </group>
      ) : null}
    </>
  );
}

function CrackWeb({ radius }: { radius: number }) {
  const cracks = useMemo(() => {
    const origin = new THREE.Vector3(0.08, 0.2, 1).normalize();
    return Array.from({ length: 5 }, (_, crackIndex) => {
      let direction = new THREE.Vector3(
        Math.cos(crackIndex * 1.7) * 0.7,
        Math.sin(crackIndex * 1.3) * 0.55,
        0,
      )
        .add(new THREE.Vector3(0, 0, 0.6))
        .normalize();
      const points: [number, number, number][] = [];
      let current = origin.clone();
      for (let step = 0; step < 5; step += 1) {
        current = current
          .clone()
          .add(direction.clone().multiplyScalar(0.09 + step * 0.012))
          .normalize();
        direction = direction
          .clone()
          .add(
            new THREE.Vector3(
              Math.sin(step * 2.4 + crackIndex) * 0.35,
              Math.cos(step * 1.8 + crackIndex) * 0.3,
              0,
            ),
          )
          .normalize();
        points.push(
          current.clone().multiplyScalar(radius * 1.012).toArray() as [
            number,
            number,
            number,
          ],
        );
      }
      return points;
    });
  }, [radius]);

  return (
    <group>
      {cracks.map((points, index) => (
        <Line
          key={index}
          points={[
            [0.08, 0.2, radius * 1.012] as [number, number, number],
            ...points,
          ]}
          color={index % 2 === 0 ? "#ffe66d" : "#ff9f45"}
          lineWidth={index % 2 === 0 ? 2.2 : 1.2}
          transparent
          opacity={0.9}
        />
      ))}
      <mesh position={[0.03, 0.07, radius * 1.018]}>
        <circleGeometry args={[radius * 0.16, 16]} />
        <meshBasicMaterial
          color="#ffd166"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

type PlanetNodeProps = {
  planet: PlanetDef;
  position: [number, number, number];
  active: boolean;
  conquered: boolean;
  compact: boolean;
  reducedMotion: boolean;
  agentUnlocked: boolean;
  onOpen: () => void;
  onLocked: () => void;
};

function PlanetNode({
  planet,
  position,
  active,
  conquered,
  compact,
  reducedMotion,
  agentUnlocked,
  onOpen,
  onLocked,
}: PlanetNodeProps) {
  const outer = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const toonGradient = useMemo(() => getToonGradient(), []);
  const spots = useMemo(() => buildSpots(planet), [planet]);
  useCursor(hovered);
  const darkSpot = useMemo(
    () => mixHex(planet.body, "#160c2a", 0.48).getStyle(),
    [planet.body],
  );

  useFrame((state, delta) => {
    if (!outer.current) return;
    const locked = planet.locked;
    const compactScale = compact ? 0.62 : 1;
    const baseScale =
      (active ? 1 : locked ? 0.82 : 0.92) * compactScale;
    const targetScale = baseScale * (hovered ? 1.08 : 1);
    const alpha = 1 - Math.exp(-5 * Math.min(delta, 0.1));
    outer.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      alpha,
    );
    if (!reducedMotion) {
      outer.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.5 + planet.id * 1.7) * 0.035;
    }
    if (spinner.current && !reducedMotion) {
      spinner.current.rotation.y +=
        delta * (active ? 0.13 : locked ? 0.035 : 0.08);
    }
  });

  function handleClick() {
    if (planet.locked) {
      onLocked();
      return;
    }
    onOpen();
  }

  return (
    <group ref={outer} position={position}>
      <sprite
        scale={[planet.size * 5.2, planet.size * 5.2, 1]}
        position={[0, 0, -0.4]}
      >
        <spriteMaterial
          map={glowTexture}
          color={planet.halo}
          transparent
          opacity={active ? 0.3 : planet.locked ? 0.08 : 0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <group ref={spinner} rotation={[0.12, 0, planet.id * 0.18]}>
        <mesh
          scale={1.06}
          renderOrder={1}
          onClick={(event) => {
            event.stopPropagation();
            handleClick();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[planet.size, 48, 48]} />
          <meshBasicMaterial color="#140620" side={THREE.BackSide} />
        </mesh>

        <mesh
          onClick={(event) => {
            event.stopPropagation();
            handleClick();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[planet.size, 48, 48]} />
          <meshToonMaterial
            color={planet.body}
            gradientMap={toonGradient}
            emissive={planet.body}
            emissiveIntensity={planet.locked ? 0.015 : 0.06}
          />
        </mesh>

        {spots.map((spot, index) => (
          <mesh
            key={index}
            position={spot.position}
            quaternion={spot.quaternion}
          >
            <circleGeometry args={[spot.size, 14]} />
            <meshBasicMaterial
              color={spot.dark ? darkSpot : planet.spot}
              transparent
              opacity={spot.dark ? 0.8 : 0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        <Atmosphere
          radius={planet.size}
          color={planet.halo}
          strength={active ? 0.95 : planet.locked ? 0.18 : 0.45}
        />

        {planet.id === 1 && agentUnlocked ? (
          <CrackWeb radius={planet.size} />
        ) : null}
      </group>

      <PlanetRings
        planet={planet}
        active={active}
        locked={planet.locked}
        reducedMotion={reducedMotion}
      />
      <MoonSystem planet={planet} reducedMotion={reducedMotion} />

      {conquered && active ? (
        <mesh rotation={[1.2, 0.2, 0.15]}>
          <ringGeometry args={[planet.size * 2.35, planet.size * 2.41, 96]} />
          <meshBasicMaterial
            color="#ffd166"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}

      {active && !reducedMotion ? (
        <group rotation={[1.18, 0.18, 0]}>
          <mesh>
            <ringGeometry
              args={[planet.size * 1.34, planet.size * 1.36, 96, 1, 0, Math.PI * 0.64]}
            />
            <meshBasicMaterial
              color={planet.ring}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <ringGeometry
              args={[planet.size * 1.42, planet.size * 1.435, 96, 1, 0, Math.PI * 0.3]}
            />
            <meshBasicMaterial
              color={planet.halo}
              transparent
              opacity={0.36}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function GalaxyRoute({
  layout,
  reducedMotion,
}: {
  layout: ScenePlanet[];
  reducedMotion: boolean;
}) {
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const comet = useRef<THREE.Group>(null);

  const { positions, colors, curve } = useMemo(() => {
    const planetPoints = layout.map(
      ({ position }) => new THREE.Vector3(...position),
    );
    const routeCurve = new THREE.CatmullRomCurve3(
      planetPoints.map(
        (point) =>
          new THREE.Vector3(point.x, point.y + 0.15, point.z + 0.25),
      ),
      false,
      "catmullrom",
      0.2,
    );
    const count = 260;
    const points = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const point = routeCurve.getPoint(index / (count - 1));
      points[index * 3] = point.x;
      points[index * 3 + 1] = point.y;
      points[index * 3 + 2] = point.z;
      const progress = index / (count - 1);
      const color = new THREE.Color("#b8ff3d").lerp(
        new THREE.Color("#ff4ecd"),
        Math.min(1, progress * 1.25),
      );
      colorArray[index * 3] = color.r;
      colorArray[index * 3 + 1] = color.g;
      colorArray[index * 3 + 2] = color.b;
    }
    return { positions: points, colors: colorArray, curve: routeCurve };
  }, [layout]);

  useFrame((state) => {
    if (!comet.current || reducedMotion) return;
    const progress = (state.clock.elapsedTime * 0.03) % 1;
    const point = curve.getPoint(progress);
    comet.current.position.copy(point);
  });

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={glowTexture}
          vertexColors
          size={0.26}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.052}
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <group ref={comet}>
        <sprite scale={[0.64, 0.64, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#fff2a8"
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

function AsteroidStrike({
  impactActive,
  reducedMotion,
}: {
  impactActive: boolean;
  reducedMotion: boolean;
}) {
  const asteroid = useRef<THREE.Group>(null);
  const trail = useRef<THREE.Group>(null);
  const shockwave = useRef<THREE.Mesh>(null);
  const shockMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const flash = useRef<THREE.Mesh>(null);
  const flashMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const startedAt = useRef<number | null>(null);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const planetPosition = useMemo(
    () => new THREE.Vector3(...DESKTOP_POSITIONS[0]),
    [],
  );
  const start = useMemo(
    () => planetPosition.clone().add(new THREE.Vector3(2.9, 2.2, 2.4)),
    [planetPosition],
  );
  const control = useMemo(
    () => planetPosition.clone().add(new THREE.Vector3(1.4, 1.4, 1.6)),
    [planetPosition],
  );
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(start, control, planetPosition),
    [planetPosition, start, control],
  );

  useFrame((state, delta) => {
    if (!impactActive) {
      startedAt.current = null;
      return;
    }
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startedAt.current;
    const flight = reducedMotion ? 1.4 : 2.5;
    const progress = THREE.MathUtils.clamp(elapsed / flight, 0, 1);
    const eased = progress * progress;
    const point = curve.getPoint(eased);

    if (asteroid.current) {
      asteroid.current.position.copy(point);
      asteroid.current.visible = progress < 0.99;
      asteroid.current.rotation.x += delta * 2.4;
      asteroid.current.rotation.y += delta * 1.7;
      asteroid.current.scale.setScalar(
        progress < 0.99 ? 1 + Math.sin(elapsed * 10) * 0.04 : 0.001,
      );
    }

    if (trail.current) {
      trail.current.children.forEach((child, index) => {
        const back = Math.max(0, eased - 0.035 * (index + 1));
        const trailPoint = curve.getPoint(back);
        child.position.copy(trailPoint);
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = progress < 0.99 ? 0.55 * (1 - index / 9) : 0;
      });
    }

    const impactElapsed = elapsed - flight;
    if (shockwave.current && shockMaterial.current && shockwave.current.parent) {
      const wave = THREE.MathUtils.clamp(impactElapsed / 1.1, 0, 1);
      shockwave.current.visible = impactElapsed > 0;
      shockwave.current.scale.setScalar(0.3 + wave * 3.4);
      shockMaterial.current.opacity = Math.max(0, 0.85 - wave);
    }
    if (flash.current && flashMaterial.current) {
      const flashProgress = THREE.MathUtils.clamp(impactElapsed / 0.5, 0, 1);
      flash.current.visible = impactElapsed > 0 && flashProgress < 1;
      flash.current.scale.setScalar(0.2 + flashProgress * 3.2);
      flashMaterial.current.opacity = Math.max(0, 0.7 - flashProgress);
    }
  });

  return (
    <group>
      <group ref={asteroid}>
        <mesh>
          <icosahedronGeometry args={[0.36, 1]} />
          <meshToonMaterial color="#ff9f45" emissive="#ff4ecd" emissiveIntensity={0.45} />
        </mesh>
        <mesh position={[0.16, 0.18, 0.12]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshToonMaterial color="#ffe66d" />
        </mesh>
        <pointLight color="#ff9f45" intensity={14} distance={8} />
        <sprite scale={[2.4, 2.4, 1]} position={[0, 0, -0.2]}>
          <spriteMaterial
            map={glowTexture}
            color="#ff9f45"
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>

      <group ref={trail}>
        {Array.from({ length: 8 }, (_, index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.17 - index * 0.012, 8, 8]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#ff4ecd" : "#ffe66d"}
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={shockwave} position={planetPosition} rotation={[1.2, 0.1, 0]}>
        <ringGeometry args={[0.9, 1.15, 96]} />
        <meshBasicMaterial
          ref={shockMaterial}
          color="#fff2a8"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={flash} position={planetPosition}>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshBasicMaterial
          ref={flashMaterial}
          color="#ff4ecd"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function CosmicBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const stars = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = ["#ff4ecd", "#b8ff3d", "#4cf4ff", "#b18cff", "#ffe66d"];
    let seed = 1729;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let index = 0; index < count; index += 1) {
      const radius = 18 + random() * 46;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius * 0.72;
      positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 20;
      const color = new THREE.Color(
        palette[Math.floor(random() * palette.length)],
      );
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  return (
    <>
      <Stars
        radius={95}
        depth={55}
        count={4800}
        factor={4}
        saturation={0.35}
        fade
        speed={reducedMotion ? 0 : 0.22}
      />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.055}
          transparent
          opacity={0.65}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <Sparkles
        count={reducedMotion ? 20 : 70}
        scale={[17, 10, 9]}
        position={[0.8, 0.3, -2.2]}
        size={2.6}
        speed={reducedMotion ? 0 : 0.3}
        opacity={0.55}
        color="#fff2a8"
        noise={0.8}
      />
    </>
  );
}

function SceneContent({
  mode,
  conquered,
  agentUnlocked,
  impactActive,
  reducedMotion,
  onOpenXylos,
  onLockedPlanet,
}: GalaxySceneProps) {
  const { size } = useThree();
  const compact = size.width < 820;
  const positions = compact ? COMPACT_POSITIONS : DESKTOP_POSITIONS;
  const planets: ScenePlanet[] = PLANETS.map((planet, index) => ({
    planet,
    position: positions[index],
  }));

  return (
    <>
      <CameraRig mode={mode} compact={compact} reducedMotion={reducedMotion} />
      <ambientLight intensity={0.38} />
      <directionalLight position={[6, 8, 10]} intensity={3.4} color="#fff6ff" />
      <directionalLight position={[-8, -2, 4]} intensity={0.35} color="#4cf4ff" />
      <CosmicBackdrop reducedMotion={reducedMotion} />
      <GalaxyRoute layout={planets} reducedMotion={reducedMotion} />
      <Suspense fallback={null}>
        {planets.map(({ planet, position }) => (
          <PlanetNode
            key={planet.id}
            planet={planet}
            position={position}
            active={!planet.locked}
            conquered={conquered}
            compact={compact}
            reducedMotion={reducedMotion}
            agentUnlocked={agentUnlocked}
            onOpen={onOpenXylos}
            onLocked={() => onLockedPlanet(planet)}
          />
        ))}
      </Suspense>
      {impactActive ? (
        <AsteroidStrike impactActive={impactActive} reducedMotion={reducedMotion} />
      ) : null}
    </>
  );
}

export function GalaxyScene(props: GalaxySceneProps) {
  return (
    <div className="galaxy-canvas" data-testid="galaxy-canvas" data-planet-count="12">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: DESKTOP_CAMERA.position, fov: 40, near: 0.1, far: 160 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
      <PlanetLabels
        mode={props.mode}
        onLockedPlanet={props.onLockedPlanet}
      />
    </div>
  );
}
