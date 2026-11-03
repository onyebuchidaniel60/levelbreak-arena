import {
  init,
  NimiqProviderError,
  type NimiqProvider,
} from "@nimiq/mini-app-sdk";
import { ApiError } from "./api";

export type WalletDetection =
  | { status: "ready"; provider: NimiqProvider; address: string }
  | { status: "no-account"; provider: NimiqProvider }
  | { status: "unavailable"; message: string }
  | { status: "denied"; message: string }
  | { status: "error"; message: string };

export async function detectNimiqWallet(): Promise<WalletDetection> {
  let provider: NimiqProvider;
  try {
    provider = await init({ timeout: 1_500 });
  } catch {
    return {
      status: "unavailable",
      message: "Open this app in Nimiq Pay to connect your wallet.",
    };
  }

  try {
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      return { status: "no-account", provider };
    }
    return { status: "ready", provider, address: accounts[0] };
  } catch (error) {
    if (NimiqProviderError.is(error) && error.type === "PERMISSION_DENIED") {
      return {
        status: "denied",
        message: "Wallet connection was cancelled. You can try again.",
      };
    }
    return {
      status: "error",
      message: "Nimiq Pay could not provide a wallet account.",
    };
  }
}

export function friendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_SIGNATURE":
        return "The wallet signature could not be verified. Please try again.";
      case "NONCE_ALREADY_USED":
        return "This sign-in attempt was already used. Please try again.";
      case "NONCE_EXPIRED":
        return "The sign-in challenge expired. Please try again.";
      case "ORIGIN_MISMATCH":
        return "Sign-in was rejected because the app origin did not match.";
      case "RATE_LIMITED":
        return "Too many sign-in attempts. Wait a moment and try again.";
      case "NETWORK_ERROR":
        return "The network request failed. Check your connection and try again.";
      default:
        return error.message;
    }
  }

  if (NimiqProviderError.is(error)) {
    switch (error.type) {
      case "PERMISSION_DENIED":
        return "Wallet connection was cancelled. You can try again.";
      case "NETWORK_ERROR":
        return "Nimiq Pay could not reach the wallet network.";
      case "INTERNAL_ERROR":
        return "Nimiq Pay could not complete the signature request.";
      default:
        return error.message;
    }
  }

  return "Wallet sign-in failed. Please try again.";
}

export function isPlayerRejection(error: unknown): boolean {
  return (
    NimiqProviderError.is(error) && error.type === "PERMISSION_DENIED"
  );
}
