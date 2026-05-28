import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { roles, userRoles, users, userSessions } from '$lib/server/db/schema';
import type { AuthUser } from '$lib/server/auth/basic';

const SESSION_COOKIE_NAME = 'lw_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev,
		maxAge: SESSION_MAX_AGE_SECONDS
	};
}

function extractClientIp(request: Request) {
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		return forwardedFor.split(',')[0]?.trim() ?? null;
	}
	return null;
}

async function buildAuthUser(userId: string): Promise<AuthUser | null> {
	const [user] = await db
		.select({ id: users.id, email: users.email, fullName: users.fullName })
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
		roles: userRoleRows.map((item) => item.code)
	};
}

export async function createSession(event: RequestEvent, userId: string) {
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

	await db.insert(userSessions).values({
		userId,
		token,
		expiresAt,
		ipAddress: extractClientIp(event.request),
		userAgent: event.request.headers.get('user-agent')
	});

	event.cookies.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function destroySession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE_NAME);

	if (token) {
		await db
			.update(userSessions)
			.set({ revokedAt: new Date() })
			.where(and(eq(userSessions.token, token), isNull(userSessions.revokedAt)));
	}

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export async function getAuthenticatedUserFromSession(event: Pick<RequestEvent, 'cookies'>): Promise<AuthUser | null> {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (!token) {
		return null;
	}

	const now = new Date();
	const [session] = await db
		.select({ userId: userSessions.userId })
		.from(userSessions)
		.where(
			and(eq(userSessions.token, token), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, now))
		)
		.limit(1);

	if (!session) {
		return null;
	}

	return buildAuthUser(session.userId);
}

export { SESSION_COOKIE_NAME };
