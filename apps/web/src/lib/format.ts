const LUNA_PER_NIM = 100_000n;

export function formatNim(luna: string): string {
  let value: bigint;
  try {
    value = BigInt(luna);
  } catch {
    return luna;
  }
  const whole = value / LUNA_PER_NIM;
  const fraction = (value % LUNA_PER_NIM)
    .toString()
    .padStart(5, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function formatLuna(value: string): string {
  try {
    return BigInt(value).toLocaleString("en-US");
  } catch {
    return value;
  }
}

export function formatVirtualUnits(value: string, unit: string): string {
  let amount: bigint;
  try {
    amount = BigInt(value);
  } catch {
    return `${value} ${unit}`;
  }
  const whole = amount / LUNA_PER_NIM;
  const fraction = (amount % LUNA_PER_NIM)
    .toString()
    .padStart(5, "0")
    .replace(/0+$/, "");
  return `${fraction ? `${whole}.${fraction}` : whole} ${unit}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function payoutStatusLabel(status: string): string {
  switch (status) {
    case "NONE":
      return "No payout";
    case "QUEUED":
      return "Payout queued";
    case "BUILDING":
      return "Payout building";
    case "SUBMITTED":
      return "Payout submitted";
    case "CONFIRMED":
      return "Payout confirmed";
    case "FAILED":
      return "Payout failed";
    case "RECONCILING":
      return "Payout reconciling";
    case "CANCELLED":
      return "Payout cancelled";
    default:
      return status;
  }
}

export function runStateLabel(state: string): string {
  switch (state) {
    case "IN_PROGRESS":
      return "In progress";
    case "CONSULTATION_PENDING":
      return "Consultation pending";
    case "COMPLETED":
      return "Run complete";
    case "PAYOUT_QUEUED":
      return "Payout queued";
    case "PAYOUT_SUBMITTED":
      return "Payout submitted";
    case "PAYOUT_CONFIRMED":
      return "Payout confirmed";
    case "COMPLETED_NO_REWARD":
      return "Complete — no reward";
    default:
      return state;
  }
}
