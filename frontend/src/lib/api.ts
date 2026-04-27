const LOCAL_API_ORIGIN = "http://localhost:3000";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function getFallbackApiOrigin() {
  if (typeof window === "undefined") {
    return LOCAL_API_ORIGIN;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname)
    ? LOCAL_API_ORIGIN
    : window.location.origin;
}

function resolveApiOrigin() {
  const configured = trimTrailingSlashes(import.meta.env.VITE_API_URL?.trim() || "");
  const fallback = getFallbackApiOrigin();

  if (!configured) {
    return fallback;
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configured.startsWith("http://")
  ) {
    console.warn(
      `Ignoring insecure VITE_API_URL "${configured}" on an HTTPS page and falling back to "${fallback}".`,
    );
    return fallback;
  }

  return configured;
}

export const API_URL = resolveApiOrigin();
