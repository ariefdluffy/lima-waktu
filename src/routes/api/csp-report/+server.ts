import { json, type RequestHandler } from "@sveltejs/kit";

/**
 * CSP violation report receiver.
 * Browser POST violation reports here when CSP blocks content.
 * Used to detect XSS attempts and misconfigured resources.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const report = body["csp-report"] || body;

    // Extract useful data from CSP report
    const violationData = {
      timestamp: new Date().toISOString(),
      originalUri: report["request-uri"] ?? report["original-uri"] ?? request.url,
      referrer: report["referrer"] ?? null,
      blockedUri: report["blocked-uri"] ?? null,
      violatedDirective: report["violated-directive"] ?? null,
      effectiveDirective: report["effective-directive"] ?? null,
      originalPolicy: report["original-policy"] ?? report["document-policy"] ?? null,
      sourceFile: report["source-file"] ?? null,
      lineNumber: report["line-number"] ?? null,
      columnNumber: report["column-number"] ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.socket.remoteAddress ?? null,
    };

    // Log CSP violation (in production, send to monitoring service)
    console.error(
      "[CSP-VIOLATION]",
      JSON.stringify(violationData, null, 2)
    );

    return json({ accepted: true }, { status: 200 });
  } catch {
    // Accept any malformed report — don't leak info
    return json({ accepted: true }, { status: 200 });
  }
};

/**
 * Accept GET requests too — some older browsers send GET.
 */
export const GET: RequestHandler = async () => {
  return json({ accepted: true }, { status: 200 });
};
