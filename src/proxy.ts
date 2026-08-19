import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Stamps every request with an x-request-id (reusing one if the caller
 * already sent it) so route handlers and logs can be correlated end to
 * end. Named `proxy` per Next.js 16's rename of `middleware` -> `proxy`.
 */
export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
