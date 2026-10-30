export const primaryNav = [
  { to: "/play", label: "Play" },
  { to: "/history", label: "History" },
  { to: "/how-it-works", label: "How it works" },
] as const;

export const appRoutePaths = [
  "/",
  "/play",
  "/play/:runId",
  "/history",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/docs",
  "*",
] as const;
