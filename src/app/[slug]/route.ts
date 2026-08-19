import { NextRequest, NextResponse } from "next/server";
import { suggestSlugs } from "@/lib/fuzzy";
import { logger } from "@/lib/logger";
import { getLink, listLinks, recordVisit } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const { slug } = await params;

  const link = getLink(slug);
  if (!link) {
    const suggestions = suggestSlugs(
      slug,
      listLinks().map((l) => l.slug)
    );
    logger.warn("link_visit_not_found", { requestId, slug, suggestions });
    return new NextResponse(notFoundHtml(slug, suggestions), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "x-request-id": requestId },
    });
  }

  recordVisit(slug);
  logger.info("link_visited", { requestId, slug, destination: link.url });
  return NextResponse.redirect(link.url, {
    status: 302,
    headers: { "x-request-id": requestId },
  });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!)
  );
}

function notFoundHtml(slug: string, suggestions: string[]): string {
  const safeSlug = escapeHtml(slug);
  const suggestionsHtml =
    suggestions.length > 0
      ? `<p>Did you mean:</p>
  <ul style="list-style: none; padding: 0;">
    ${suggestions
      .map(
        (s) =>
          `<li><a href="/${encodeURIComponent(s)}" style="font-weight: 600;">go/${escapeHtml(s)}</a></li>`
      )
      .join("\n    ")}
  </ul>`
      : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>go/${safeSlug} not found</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; text-align: center;">
  <h1 style="font-size: 1.5rem;">go/${safeSlug} doesn't exist yet</h1>
  <p>No one has created this shortcut.</p>
  ${suggestionsHtml}
  <p><a href="/?create=${encodeURIComponent(slug)}">Create it</a></p>
</body>
</html>`;
}
