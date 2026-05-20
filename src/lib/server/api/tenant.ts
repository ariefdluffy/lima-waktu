import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { masjidUsers } from '$lib/server/db/schema';
import type { AuthUser } from '$lib/server/auth/basic';

export async function resolveMasjidIdForUser(user: AuthUser, requestedMasjidId: string | null) {
	if (user.roles.includes('superadmin')) {
		if (!requestedMasjidId) {
			throw new Error('masjid_id wajib diisi untuk superadmin');
		}
		return requestedMasjidId;
	}

	if (requestedMasjidId) {
		const [membership] = await db
			.select({ masjidId: masjidUsers.masjidId })
			.from(masjidUsers)
			.where(
				and(eq(masjidUsers.userId, user.id), eq(masjidUsers.masjidId, requestedMasjidId), eq(masjidUsers.isActive, 1))
			)
			.limit(1);

		if (!membership) {
			throw new Error('Anda tidak memiliki akses ke masjid ini');
		}

		return membership.masjidId;
	}

	const [membership] = await db
		.select({ masjidId: masjidUsers.masjidId })
		.from(masjidUsers)
		.where(and(eq(masjidUsers.userId, user.id), eq(masjidUsers.isActive, 1)))
		.limit(1);

	if (!membership) {
		throw new Error('Akun ini belum terhubung ke masjid manapun');
	}

	return membership.masjidId;
}
