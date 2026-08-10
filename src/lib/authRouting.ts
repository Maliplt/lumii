export interface AuthRouteState {
  returnTo?: string;
}

export function safeAuthReturnTo(state: unknown, fallback = "/"): string {
  const returnTo = (state as AuthRouteState | null)?.returnTo;
  if (
    typeof returnTo !== "string" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo === "/login" ||
    returnTo === "/register" ||
    returnTo === "/profiles"
  ) {
    return fallback;
  }
  return returnTo;
}
