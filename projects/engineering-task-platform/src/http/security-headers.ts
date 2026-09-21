import type { ServerResponse } from "node:http";

export function setSecurityHeaders(response: ServerResponse): void {
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("content-security-policy", "default-src 'none'");
  response.setHeader("cache-control", "no-store");
}
