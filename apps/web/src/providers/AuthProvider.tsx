import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, isApiError } from "../lib/api";
import {
  buildVerifyRequest,
  detectNimiqWallet,
  friendlyAuthError,
  type WalletDetection,
} from "../lib/nimiq";
import { useMeQuery, queryKeys } from "../hooks/useApi";
import type { MeResponse } from "@levelbreak-arena/contracts";
import type { NimiqProvider } from "@nimiq/mini-app-sdk";

type WalletState =
  | { status: "detecting" }
  | { status: "session" }
  | { status: "ready"; provider: NimiqProvider; address: string }
  | { status: "no-account" }
  | { status: "unavailable"; message: string }
  | { status: "denied"; message: string }
  | { status: "error"; message: string };

type AuthContextValue = {
  me: MeResponse | null;
  meLoading: boolean;
  meError: Error | null;
  isAuthenticated: boolean;
  wallet: WalletState;
  signIn: () => Promise<void>;
  isSigningIn: boolean;
  signInError: string | null;
  clearSignInError: () => void;
  retryWallet: () => void;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  logoutError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toWalletState(detection: WalletDetection): WalletState {
  switch (detection.status) {
    case "ready":
      return {
        status: "ready",
        provider: detection.provider,
        address: detection.address,
      };
    case "no-account":
      return { status: "no-account" };
    case "unavailable":
      return { status: "unavailable", message: detection.message };
    case "denied":
      return { status: "denied", message: detection.message };
    case "error":
      return { status: "error", message: detection.message };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const meQuery = useMeQuery();
  const [wallet, setWallet] = useState<WalletState>({ status: "detecting" });
  const [walletAttempt, setWalletAttempt] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (meQuery.isLoading) return;
    if (meQuery.data) {
      setWallet({ status: "session" });
      return;
    }
    if (meQuery.isError) return;

    let cancelled = false;
    setWallet({ status: "detecting" });
    void detectNimiqWallet().then((detection) => {
      if (!cancelled) setWallet(toWalletState(detection));
    });
    return () => {
      cancelled = true;
    };
  }, [meQuery.isLoading, meQuery.data, meQuery.isError, walletAttempt]);

  const signIn = useCallback(async () => {
    if (wallet.status !== "ready") {
      setSignInError("A Nimiq Pay wallet is not available to sign in.");
      return;
    }
    setIsSigningIn(true);
    setSignInError(null);
    try {
      const nonce = await api.nonce(wallet.address, window.location.origin);
      const signed = await wallet.provider.sign(nonce.challenge);
      const verifyRequest = buildVerifyRequest(nonce, signed, wallet.address);
      if (import.meta.env.DEV) {
        // Local diagnostic only. Production never logs signatures.
        console.debug("[auth] challenge", verifyRequest.challenge);
        console.debug("[auth] signature", verifyRequest.signature);
      }
      await api.verify(verifyRequest);
      await queryClient.refetchQueries({ queryKey: queryKeys.me });
      navigate("/play");
    } catch (error) {
      setSignInError(friendlyAuthError(error));
      if (isApiError(error) && error.status === 401) {
        setWallet({ status: "detecting" });
        setWalletAttempt((value) => value + 1);
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [wallet, queryClient, navigate]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await api.logout();
      queryClient.clear();
      navigate("/");
    } catch (error) {
      setLogoutError(
        isApiError(error)
          ? error.message
          : "Sign-out failed. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }, [queryClient, navigate]);

  const clearSignInError = useCallback(() => setSignInError(null), []);
  const retryWallet = useCallback(() => {
    setSignInError(null);
    setWalletAttempt((value) => value + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      me: meQuery.data ?? null,
      meLoading: meQuery.isLoading,
      meError: (meQuery.error as Error | null) ?? null,
      isAuthenticated: Boolean(meQuery.data),
      wallet,
      signIn,
      isSigningIn,
      signInError,
      clearSignInError,
      retryWallet,
      logout,
      isLoggingOut,
      logoutError,
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      meQuery.error,
      wallet,
      signIn,
      isSigningIn,
      signInError,
      clearSignInError,
      retryWallet,
      logout,
      isLoggingOut,
      logoutError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
