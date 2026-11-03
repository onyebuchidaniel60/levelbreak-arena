import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./providers/AuthProvider";
import { retryDelay, retryQuery } from "./hooks/useApi";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryQuery,
      retryDelay,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
