import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import { getAuthenticatedUserFromSession } from "$lib/server/auth/session";
// import { startPrayerScheduler } from "$lib/server/prayer/scheduler";

// PrayerScheduler dimatikan sementara — aktifkan kembali jika diperlukan
// try {
//   startPrayerScheduler();
// } catch (err) {
//   const msg = err instanceof Error ? err.message : String(err);
//   console.error("[Hooks] Failed to start prayer scheduler:", msg);
// }

const authHandle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getAuthenticatedUserFromSession(event);
  return resolve(event);
};

const securityHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  const isDisplayRoute = event.url.pathname.startsWith("/display");
  const isProduction = process.env.NODE_ENV === "production";

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS — only in production
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // X-Permitted-Cross-Domain-Policies
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  if (!isDisplayRoute) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "frame-src 'self'",
        "frame-ancestors 'self'",
        isProduction ? "report-uri /api/csp-report" : undefined,
      ]
        .filter(Boolean)
        .join("; "),
    );
  } else {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.open-meteo.com https://www.youtube.com https://i.ytimg.com",
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
        "frame-ancestors 'self'",
        isProduction ? "report-uri /api/csp-report" : undefined,
      ]
        .filter(Boolean)
        .join("; "),
    );
  }

  return response;
};

export const handle = sequence(authHandle, securityHandle);
