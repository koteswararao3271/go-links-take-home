import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { deleteLink, getLink } from "@/lib/store";
import type { ApiError } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = { "x-request-id": requestId };
  const { slug } = await params;

  const link = getLink(slug);
  if (!link) {
    return NextResponse.json<ApiError>(
      { error: { code: "not_found", message: `No shortcut named "${slug}"` } },
      { status: 404, headers }
    );
  }
  return NextResponse.json({ link }, { headers });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = { "x-request-id": requestId };
  const { slug } = await params;

  const deleted = deleteLink(slug);
  if (!deleted) {
    logger.warn("link_delete_rejected", { requestId, slug, reason: "not_found" });
    return NextResponse.json<ApiError>(
      { error: { code: "not_found", message: `No shortcut named "${slug}"` } },
      { status: 404, headers }
    );
  }
  logger.info("link_deleted", { requestId, slug });
  return new NextResponse(null, { status: 204, headers });
}
