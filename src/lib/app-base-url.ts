const LOCAL_BASE_URL = "http://localhost:3000";

export function getAppBaseUrl(fallback?: string) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Ignore invalid APP_BASE_URL and continue to fallback handling.
    }
  }

  if (fallback) {
    return new URL(fallback);
  }

  return new URL(LOCAL_BASE_URL);
}
