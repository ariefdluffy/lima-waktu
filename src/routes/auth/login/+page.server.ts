import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { createSession } from "$lib/server/auth/session";
import { findAuthUserByCredentials } from "$lib/server/auth/basic";
import { writeAuditLog } from "$lib/server/audit";

// Simple in-memory rate limiter (reset on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    if (locals.user.roles.includes("superadmin")) {
      throw redirect(302, "/superadmin");
    }
    throw redirect(302, "/admin");
  }
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const ip = getClientIp(event.request);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return fail(429, {
        message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
        email: "",
      });
    }

    const form = await event.request.formData();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      return fail(400, { message: "Email dan password wajib diisi", email });
    }

    const user = await findAuthUserByCredentials(email, password);
    if (!user) {
      return fail(401, { message: "Email / password tidak valid", email });
    }

    await createSession(event, user.id);
    resetRateLimit(ip);

    await writeAuditLog({
      userId: user.id,
      action: "login",
      entity: "user_session",
      ipAddress: ip,
      userAgent: event.request.headers.get("user-agent"),
    });

    if (user.roles.includes("superadmin")) {
      throw redirect(302, "/superadmin");
    }
    throw redirect(302, "/admin");
  },
};
