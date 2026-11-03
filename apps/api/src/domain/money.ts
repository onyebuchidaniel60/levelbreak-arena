/**
 * Monetary helpers. All NIM accounting is integer Luna; no floating-point
 * arithmetic is permitted on financial values.
 */

export type LunaValue = bigint | string | number;

export function toLuna(value: LunaValue): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("Unsafe integer passed to a Luna monetary field");
    }
    return BigInt(value);
  }
  if (!/^-?\d+$/.test(value)) {
    throw new Error("Luna value must be a decimal integer string");
  }
  return BigInt(value);
}

export function lunaString(value: LunaValue): string {
  return toLuna(value).toString();
}

export function assertNonNegativeLuna(value: LunaValue, field: string): bigint {
  const amount = toLuna(value);
  if (amount < 0n) {
    throw new Error(`${field} must not be negative`);
  }
  return amount;
}

export function assertPositiveLuna(value: LunaValue, field: string): bigint {
  const amount = toLuna(value);
  if (amount <= 0n) {
    throw new Error(`${field} must be positive`);
  }
  return amount;
}

/** Apply integer basis points without floating point arithmetic. */
export function applyBasisPoints(amount: bigint, basisPoints: bigint): bigint {
  if (basisPoints < 0n) {
    throw new Error("Basis points must not be negative");
  }
  return (amount * basisPoints) / 10_000n;
}

export const LUNA_PER_NIM = 100_000n;

export function lunaToNimString(value: LunaValue): string {
  const luna = toLuna(value);
  const whole = luna / LUNA_PER_NIM;
  const fraction = luna % LUNA_PER_NIM;
  return `${whole}.${fraction.toString().padStart(5, "0")}`;
}
