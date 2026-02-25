/**
 * Turn an unknown caught error into a string safe to send in API JSON (no "[object Object]").
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }
  return String(error);
}

/**
 * If the error looks like a network/fetch failure, append a hint about Supabase connectivity.
 */
export function getErrorMessageWithHint(error: unknown, context: "Supabase"): string {
  const msg = getErrorMessage(error);
  const isFetchFailed =
    /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(msg) ||
    msg === "fetch failed";
  if (isFetchFailed && context === "Supabase") {
    return `${msg}. The server cannot reach Supabase — check NEXT_PUBLIC_SUPABASE_URL and that this machine has internet access.`;
  }
  return msg;
}
