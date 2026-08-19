import type { LinkHealth } from "./types";

const TIMEOUT_MS = 4000;

// Some CDNs/bot-protection (e.g. Cloudflare in front of Figma) 403 a
// User-Agent-less request outright, which would otherwise read as a false
// "broken" result. A generic browser UA sidesteps that without pretending
// to be anything specific.
const REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; go-links-health-check/1.0; +internal link checker)",
};

export interface HealthCheckResult {
  health: LinkHealth;
  statusCode?: number;
  error?: string;
  checkedAt: string;
}

/**
 * Probes a destination URL to see if it's still alive. HEAD first (cheap,
 * no response body) and falls back to GET, since some servers reject HEAD
 * with 404/405 even though the resource is reachable.
 */
export async function checkUrlHealth(url: string): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: REQUEST_HEADERS,
    });
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: REQUEST_HEADERS,
      });
    }
    return { health: res.ok ? "healthy" : "broken", statusCode: res.status, checkedAt };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      health: "broken",
      error: isAbort ? "timed out" : err instanceof Error ? err.message : "unknown error",
      checkedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
