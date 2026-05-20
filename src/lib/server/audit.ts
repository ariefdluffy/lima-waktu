import { db } from '$lib/server/db';
import { auditLogs } from '$lib/server/db/schema';

export type AuditAction =
	| 'login'
	| 'logout'
	| 'create'
	| 'update'
	| 'delete'
	| 'upload';

export async function writeAuditLog(params: {
	masjidId?: string | null;
	userId?: string | null;
	action: AuditAction;
	entity: string;
	entityId?: string | null;
	changesJson?: unknown;
	ipAddress?: string | null;
	userAgent?: string | null;
}) {
	try {
		await db.insert(auditLogs).values({
			masjidId: params.masjidId ?? null,
			userId: params.userId ?? null,
			action: params.action,
			entity: params.entity,
			entityId: params.entityId ?? null,
			changesJson: params.changesJson ?? null,
			ipAddress: params.ipAddress ?? null,
			userAgent: params.userAgent ?? null
		});
	} catch {
		// Audit log tidak boleh crash aplikasi utama
		console.error('[audit] Failed to write audit log', params);
	}
}
