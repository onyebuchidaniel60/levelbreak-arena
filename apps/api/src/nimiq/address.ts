import { Address } from "@nimiq/core";

export function normalizeAddress(address: string): string {
  return Address.fromUserFriendlyAddress(address).toUserFriendlyAddress();
}

export function addressesEqual(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}
