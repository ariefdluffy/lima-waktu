import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import { getAuthenticatedUserFromSession } from "$lib/server/auth/session";

const authHandle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getAuthenticatedUserFromSession(event);
  return resolve(event);
};

const securityHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  const isDisplayRoute = event.url.pathname.startsWith("/display");

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (!isDisplayRoute) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: /uploads/",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src 'self'",
        "frame-ancestors 'self'",
      ].join("; "),
    );
  } else {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'self'",
      ].join("; "),
    );
  }

  return response;
};

export const handle = sequence(authHandle, securityHandle);
