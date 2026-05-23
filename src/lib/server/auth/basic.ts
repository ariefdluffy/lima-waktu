import { and, eq } from "drizzle-orm";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { roles, userRoles, users } from "$lib/server/db/schema";
import { getAuthenticatedUserFromSession } from "$lib/server/auth/session";
import { verifyPassword } from "$lib/server/auth/password";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

function decodeBasicAuthHeader(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  const encoded = authorization.slice("Basic ".length).trim();
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 1) {
    return null;
  }

  const email = decoded.slice(0, separatorIndex).trim().toLowerCase();
  const password = decoded.slice(separatorIndex + 1);

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function findAuthUserById(
  userId: string,
): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, 1)))
    .limit(1);

  if (!user) {
    return null;
  }

  const userRoleRows = await db
    .select({ code: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: userRoleRows.map((item) => item.code),
  };
}

export async function findAuthUserByCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, 1)))
    .limit(1);

  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  return findAuthUserById(user.id);
}

export async function authenticateRequest(
  request: Request,
): Promise<AuthUser | null> {
  const creds = decodeBasicAuthHeader(request.headers.get("authorization"));

  if (!creds) {
    return null;
  }

  return findAuthUserByCredentials(creds.email, creds.password);
}

export async function authenticateEvent(
  event: RequestEvent,
): Promise<AuthUser | null> {
  const fromSession = await getAuthenticatedUserFromSession(event);
  if (fromSession) {
    return fromSession;
  }

  return authenticateRequest(event.request);
}

export function hasAnyRole(user: AuthUser, allowedRoles: string[]) {
  return user.roles.some((role) => allowedRoles.includes(role));
}
