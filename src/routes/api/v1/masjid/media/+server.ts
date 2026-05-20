import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { mediaAssets } from "$lib/server/db/schema";

const ALLOWED_MIME = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const masjidId = await resolveMasjidIdForUser(
    user,
    event.url.searchParams.get("masjid_id"),
  );
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.masjidId, masjidId))
    .orderBy(desc(mediaAssets.createdAt));

  return json({ ok: true, data: rows });
};

export const POST: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    event.url.searchParams.get("masjid_id"),
  );

  const formData = await event.request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim() || null;

  if (!(file instanceof File)) {
    return json(
      { ok: false, message: "Field 'file' wajib diisi" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return json(
      { ok: false, message: "Tipe file tidak diizinkan. Hanya JPEG dan PNG." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return json(
      { ok: false, message: "Ukuran file maksimal 1MB." },
      { status: 400 },
    );
  }

  const ext = extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const uploadDir = join(process.cwd(), "static", "uploads", masjidId);
  const filePath = join(uploadDir, filename);
  const fileUrl = `/uploads/${masjidId}/${filename}`;

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  await db.insert(mediaAssets).values({
    masjidId,
    fileUrl,
    fileType: "image",
    mimeType: file.type,
    sizeBytes: file.size,
    title: title ?? file.name,
    uploadedBy: user.id,
  });

  const [created] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.masjidId, masjidId))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(1);

  return json({ ok: true, data: created }, { status: 201 });
};
