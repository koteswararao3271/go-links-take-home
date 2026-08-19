import { NextRequest, NextResponse } from "next/server";
import { checkUrlHealth } from "@/lib/health";
import { logger } from "@/lib/logger";
import { getLink, recordHealthCheck } from "@/lib/store";
import type { ApiError } from "@/lib/types";

/**
 * On-demand health check for a single shortcut's destination URL.
 * In a production system this would run on a schedule (cron/queue) instead
 * of per-request, but for a first iteration, "check on click" is a
 * reasonable, much cheaper starting point — see README tradeoffs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = { "x-request-id": requestId };
  const { slug } = await params;

  const existing = getLink(slug);
  if (!existing) {
    return NextResponse.json<ApiError>(
      { error: { code: "not_found", message: `No shortcut named "${slug}"` } },
      { status: 404, headers }
    );
  }

  const result = await checkUrlHealth(existing.url);
  const link = recordHealthCheck(slug, result);

  logger.info("link_health_checked", {
    requestId,
    slug,
    health: result.health,
    statusCode: result.statusCode,
    error: result.error,
  });

  return NextResponse.json({ link }, { headers });
}
