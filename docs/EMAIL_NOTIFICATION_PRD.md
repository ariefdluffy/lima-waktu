# PRD — Sistem Email Notification & Registrasi

**Project**: Lima Waktu — Display TV Masjid  
**Status**: Draft  
**SMTP Provider**: Mailjet  
**Last Updated**: 2026-05-23

---

## 1. Tujuan

Menambahkan sistem email notification untuk:

1. **Registrasi** — Welcome email + verifikasi email (opsional di MVP, wajib di production)
2. **Notifikasi transaksional** — Subscription reminder, invoice, device offline, prayer sync failed, dll.
3. **Notifikasi sistem** — Audit log critical, announcement, dll.

WhatsApp (Fonnte) sudah berjalan untuk notifikasi operasional masjid. Email melengkapi untuk notifikasi yang membutuhkan format kaya (HTML table, invoice, dll) dan komunikasi formal dengan admin masjid.

---

## 2. Arsitektur

### 2.1 High-Level Flow

```
User Action / Cron Job
    │
    ▼
Notification Service ──► Email Queue (DB) ──► Mailjet SMTP ──► Inbox
    │                          │
    │                          ▼
    │                    failed_attempts > N → log + skip
    │
    ▼
Audit Log (audit_logs)
```

### 2.2 Alur Registrasi

```
User submit form register
    │
    ▼
validate input → hash password → insert users table
    │
    ▼
generate email_verification token → insert email_verifications
    │
    ▼
insert email_queue → (background) send via Mailjet
    │
    ▼
redirect /auth/login (show alert: "Cek email untuk verifikasi")
```

### 2.3 Alur Verifikasi Email

```
GET /auth/verify-email?token=xxx
    │
    ▼
lookup email_verifications by token
    │
    ├── valid & not expired → users.email_verified_at = now() → show success page
    └── invalid/expired → show error page + button "Kirim ulang"
```

---

## 3. Database Schema (Drizzle ORM)

### 3.1 Tabel `users` — Tambah Kolom

```sql
ALTER TABLE users ADD COLUMN `email_verified_at` datetime;
ALTER TABLE users ADD COLUMN `unsubscribed_at` datetime;
```

Di Drizzle schema:

```typescript
// tambahkan di tabel users yg sudah ada
export const users = mysqlTable("users", {
  // ... existing columns
  emailVerifiedAt: datetime("email_verified_at"),
  unsubscribedAt: datetime("unsubscribed_at"),
});
```

### 3.2 Tabel `email_verifications`

```typescript
export const emailVerifications = mysqlTable("email_verifications", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  userId: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 128 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  verifiedAt: datetime("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("email_verifications_token_uq").on(table.token),
  index("email_verifications_user_id_idx").on(table.userId),
]);
```

### 3.3 Tabel `email_queue`

Queue-based approach: transaction email dimasukkan ke tabel, cron/scheduler proses kirim.

```typescript
export type EmailStatus = "pending" | "sending" | "sent" | "failed";
export type EmailPriority = "high" | "normal" | "low";

export const emailQueue = mysqlTable("email_queue", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  userId: char("user_id", { length: 36 })
    .references(() => users.id, { onDelete: "set null" }),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  toName: varchar("to_name", { length: 120 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  templateKey: varchar("template_key", { length: 64 }).notNull(),
  contextJson: json("context_json").notNull(),  // data yg dirender ke template
  htmlBody: text("html_body"),                   // hasil render (cache)
  textBody: text("text_body"),                   // fallback plain text

  status: mysqlEnum("status", ["pending", "sending", "sent", "failed"])
    .default("pending").notNull(),
  priority: mysqlEnum("priority", ["high", "normal", "low"])
    .default("normal").notNull(),
  retryCount: int("retry_count").default(0).notNull(),
  maxRetries: int("max_retries").default(3).notNull(),
  lastError: text("last_error"),
  sentAt: datetime("sent_at"),
  scheduledAt: datetime("scheduled_at"),         // null = kirim sekarang

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
    .$onUpdateFn(() => new Date()),
}, (table) => [
  index("email_queue_status_idx").on(table.status, table.priority),
  index("email_queue_scheduled_idx").on(table.scheduledAt),
]);
```

### 3.4 Drizzle Migration

```bash
npm run db:generate   # generate migration baru
npm run db:push:local  # push ke DB lokal
```

---

## 4. Template Email

TemplateKey dan deskripsi untuk semua skenario:

| TemplateKey | Trigger | Priority | To |
|------------|---------|----------|----|
| `welcome` | Registrasi berhasil | high | user |
| `email_verification` | Kirim token verifikasi | high | user |
| `email_verified` | Verifikasi berhasil | normal | user |
| `subscription_reminder` | 7/3/1 hari sebelum expired | high | admin masjid |
| `subscription_expired` | Subscription expired | high | admin masjid |
| `invoice_created` | Invoice baru terbit | high | admin masjid |
| `invoice_paid` | Pembayaran diterima | normal | admin masjid |
| `invoice_overdue` | Invoice lewat jatuh tempo | high | admin masjid |
| `device_offline` | Device offline > threshold | normal | admin masjid |
| `prayer_sync_failed` | Sync jadwal sholat gagal | normal | admin masjid |
| `password_reset` | Reset password (future) | high | user |
| `platform_announcement` | Announcement dari superadmin | low | all |

### 4.1 Template Engine

Gunakan Svelte atau inline HTML string di server:

- Template dirender di `/src/lib/server/email/templates/` sebagai file `.ts` yg return HTML string
- Data context disimpan di `contextJson` tabel `email_queue`
- Template bersifat stateless — cukup context → HTML

Contoh struktur:

```typescript
// src/lib/server/email/templates/welcome.ts
export type WelcomeContext = {
  fullName: string;
  email: string;
  masjidName?: string;
  loginUrl: string;
};

export function renderWelcomeHtml(ctx: WelcomeContext): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:sans-serif;background:#f4f4f4;padding:32px">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#0d2818;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0">Lima Waktu</h1>
          </div>
          <div style="padding:32px">
            <h2>Assalamu'alaikum, ${ctx.fullName}!</h2>
            <p>Akun Lima Waktu Anda berhasil dibuat.</p>
            <p>Email: <strong>${ctx.email}</strong></p>
            ${ctx.masjidName ? `<p>Masjid: <strong>${ctx.masjidName}</strong></p>` : ''}
            <a href="${ctx.loginUrl}"
               style="display:inline-block;padding:12px 32px;background:#66bb6a;color:#fff;
                      text-decoration:none;border-radius:8px;margin-top:16px">
              Login ke Dashboard
            </a>
          </div>
          <div style="padding:16px 32px;background:#f9fafb;font-size:12px;color:#666;text-align:center">
            <p>Lima Waktu — Display TV Masjid</p>
            <p><a href="{{unsubscribe_url}}" style="color:#999">Berhenti berlangganan email ini</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### 4.2 Renderer Registry

```typescript
// src/lib/server/email/templates/index.ts
import { renderWelcomeHtml } from "./welcome";
import { renderEmailVerificationHtml } from "./email-verification";
// ... etc

export const templateRegistry = {
  welcome: renderWelcomeHtml,
  email_verification: renderEmailVerificationHtml,
  // ...
} as const;

export type TemplateKey = keyof typeof templateRegistry;
```

---

## 5. Mailjet SMTP — Konfigurasi

### 5.1 Required .env Variables

```env
# Mailjet SMTP
MJ_APIKEY_PUBLIC=your_mailjet_api_key
MJ_APIKEY_PRIVATE=your_mailjet_secret_key
MJ_FROM_EMAIL=noreply@limawaktu.id
MJ_FROM_NAME="Lima Waktu"
MJ_SMTP_HOST=in-v3.mailjet.com
MJ_SMTP_PORT=587
MJ_SMTP_SECURE=false              # true for 465, false for 587

# Feature flag
EMAIL_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=false # true di production
```

### 5.2 Mailjet SMTP vs API

SMTP via `nodemailer` lebih sederhana untuk MVP dan mudah di-test. Mailjet API (REST) bisa jadi upgrade untuk tracking opens/clicks.

**Rekomendasi**: Gunakan `nodemailer` dengan SMTP Mailjet untuk MVP.

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 5.3 SMTP Client

```typescript
// src/lib/server/email/send-mailjet.ts
import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.MJ_SMTP_HOST || "in-v3.mailjet.com",
      port: parseInt(env.MJ_SMTP_PORT || "587"),
      secure: env.MJ_SMTP_SECURE === "true",
      auth: {
        user: env.MJ_APIKEY_PUBLIC,
        pass: env.MJ_APIKEY_PRIVATE,
      },
    });
  }
  return transporter;
}

export type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "high" | "normal" | "low";
  headers?: Record<string, string>;
};

export async function sendMailjetEmail(input: SendEmailInput) {
  if (env.EMAIL_ENABLED !== "true") {
    return { ok: false, status: 503 };
  }

  const trans = getTransporter();
  const info = await trans.sendMail({
    from: `"${env.MJ_FROM_NAME || "Lima Waktu"}" <${env.MJ_FROM_EMAIL || "noreply@limawaktu.id"}>`,
    to: input.toName ? `"${input.toName}" <${input.to}>` : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: input.headers,
    priority: input.priority === "high" ? "high" : "normal",
  });

  return { ok: true, messageId: info.messageId };
}
```

---

## 6. Queue Processor (Background Job)

### 6.1 Process Loop

```typescript
// src/lib/server/email/queue-processor.ts
import { db } from "$lib/server/db";
import { emailQueue } from "$lib/server/db/schema";
import { inArray, and, lte, isNull } from "drizzle-orm";
import { sendMailjetEmail } from "./send-mailjet";
import { templateRegistry } from "./templates";
import type { TemplateKey } from "./templates";

const BATCH_SIZE = 10;

export async function processEmailQueue() {
  const pending = await db
    .select()
    .from(emailQueue)
    .where(
      and(
        inArray(emailQueue.status, ["pending"]),
        lte(emailQueue.retryCount, emailQueue.maxRetries),
        or(
          isNull(emailQueue.scheduledAt),
          lte(emailQueue.scheduledAt, new Date()),
        ),
      ),
    )
    .orderBy(emailQueue.priority)
    .limit(BATCH_SIZE)
    .forUpdate()
    .skipLocked();

  for (const item of pending) {
    await db
      .update(emailQueue)
      .set({ status: "sending" })
      .where(eq(emailQueue.id, item.id));

    try {
      const renderFn = templateRegistry[item.templateKey as TemplateKey];
      const html = renderFn(item.contextJson as any);

      const result = await sendMailjetEmail({
        to: item.toEmail,
        toName: item.toName || undefined,
        subject: item.subject,
        html,
      });

      await db
        .update(emailQueue)
        .set({
          status: "sent",
          htmlBody: html,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.id, item.id));

    } catch (err) {
      const newRetry = item.retryCount + 1;
      await db
        .update(emailQueue)
        .set({
          status: newRetry >= item.maxRetries ? "failed" : "pending",
          retryCount: newRetry,
          lastError: String(err),
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.id, item.id));
    }
  }
}
```

### 6.2 Cron Invocation

Panggil dari scheduler yg sudah ada (`src/lib/server/prayer/scheduler.ts`):

```typescript
// Di prayer scheduler, tambahkan interval untuk processEmailQueue
import { processEmailQueue } from "$lib/server/email/queue-processor";

// Process email queue setiap 30 detik
setInterval(() => {
  processEmailQueue().catch((e) =>
    console.error("[email-queue] Error processing:", e)
  );
}, 30_000);
```

Atau buat endpoint internal `/api/internal/process-email-queue` yg dipanggil cron eksternal (cron-job.org, dll).

---

## 7. Integrasi ke Flow Eksisting

### 7.1 Registrasi — Kirim Welcome + Verification Email

```typescript
// src/routes/auth/register/+page.server.ts — setelah user insert
import { queueEmail } from "$lib/server/email/queue";
import { randomUUID } from "node:crypto";

// Generate verification token
const verifyToken = randomUUID() + "-" + Date.now().toString(36);
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

await db.insert(emailVerifications).values({
  userId,
  token: verifyToken,
  expiresAt,
});

// Queue email verifikasi
await queueEmail({
  userId,
  toEmail: email,
  toName: fullName,
  subject: "Verifikasi Email — Lima Waktu",
  templateKey: "email_verification",
  priority: "high",
  context: {
    fullName,
    verifyUrl: `${origin}/auth/verify-email?token=${verifyToken}`,
    expiresInHours: 24,
  },
});

// Queue welcome email setelah verifikasi sukses (atau langsung?)
// Opsi MVP: kirim welcome email langsung tanpa menunggu verifikasi
await queueEmail({
  userId,
  toEmail: email,
  toName: fullName,
  subject: "Selamat Datang di Lima Waktu!",
  templateKey: "welcome",
  priority: "normal",
  context: {
    fullName,
    email,
    loginUrl: `${origin}/auth/login`,
  },
});
```

### 7.2 Subscription Reminder (Cron)

```typescript
// Cron job — cek subscription yg akan expired
// src/lib/server/email/triggers/subscription-reminder.ts
export async function checkSubscriptionReminders() {
  const dueSubscriptions = await db
    .select({
      subscription: subscriptions,
      masjid: masjids,
      user: users,
    })
    .from(subscriptions)
    .innerJoin(masjids, eq(subscriptions.masjidId, masjids.id))
    .innerJoin(masjidUsers, eq(masjidUsers.masjidId, masjids.id))
    .innerJoin(users, eq(users.id, masjidUsers.userId))
    .where(
      and(
        inArray(subscriptions.status, ["active", "trial"]),
        inArray(subscriptions.endDate, [
          // D-7, D-3, D-1
          daysFromNow(7),
          daysFromNow(3),
          daysFromNow(1),
        ]),
      ),
    );

  for (const row of dueSubscriptions) {
    await queueEmail({
      userId: row.user.id,
      toEmail: row.user.email,
      toName: row.user.fullName,
      subject: `Langganan ${row.subscription.packageName} akan berakhir`,
      templateKey: "subscription_reminder",
      priority: "high",
      context: {
        masjidName: row.masjid.name,
        packageName: row.subscription.packageName,
        endDate: row.subscription.endDate,
        invoiceUrl: `${origin}/admin/subscriptions`,
      },
    });
  }
}
```

### 7.3 Device Offline / Prayer Sync Failed / Invoice

Sama pola: detect condition → queue email via `queueEmail()` helper.

---

## 8. Helper Functions

### 8.1 Queue Email

```typescript
// src/lib/server/email/queue.ts
import { db } from "$lib/server/db";
import { emailQueue } from "$lib/server/db/schema";
import type { TemplateKey } from "./templates";

export type QueueEmailInput = {
  userId?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  templateKey: TemplateKey;
  priority?: "high" | "normal" | "low";
  context: Record<string, unknown>;
  scheduledAt?: Date;
};

export async function queueEmail(input: QueueEmailInput, _db = db) {
  if (process.env.EMAIL_ENABLED !== "true") return null;

  const [inserted] = await _db.insert(emailQueue).values({
    userId: input.userId || null,
    toEmail: input.toEmail,
    toName: input.toName || null,
    subject: input.subject,
    templateKey: input.templateKey,
    contextJson: input.context,
    priority: input.priority || "normal",
    scheduledAt: input.scheduledAt || null,
  });

  return inserted.insertId;
}
```

### 8.2 Unsubscribe

Setiap email wajib punya link `{{unsubscribe_url}}`:

```typescript
// GET /api/email/unsubscribe?token=xxx
export async function unsubscribe(token: string) {
  // lookup user by token (simpan di users table atau tabel terpisah)
  // update users.unsubscribed_at = now()
  // return { ok: true }
}
```

Generate `unsubscribe_token` saat user pertama kali dibuat dan simpan di `users.unsubscribe_token`.

---

## 9. File Tree

```
src/lib/server/email/
├── index.ts                  # re-export semua komponen
├── queue.ts                  # queueEmail() helper
├── queue-processor.ts        # processEmailQueue() batch processor
├── send-mailjet.ts           # Mailjet SMTP client (nodemailer)
├── templates/
│   ├── index.ts              # registry semua template
│   ├── welcome.ts            # welcome email
│   ├── email-verification.ts # token verifikasi
│   ├── email-verified.ts     # konfirmasi verifikasi sukses
│   ├── subscription-reminder.ts
│   ├── subscription-expired.ts
│   ├── invoice-created.ts
│   ├── invoice-paid.ts
│   ├── invoice-overdue.ts
│   ├── device-offline.ts
│   ├── prayer-sync-failed.ts
│   ├── password-reset.ts
│   └── platform-announcement.ts
├── triggers/
│   ├── subscription-reminder.ts
│   ├── device-offline-check.ts
│   └── prayer-sync-failed.ts
```

---

## 10. Environment Variables (Lengkap)

```env
# === MAILJET SMTP ===
MJ_APIKEY_PUBLIC=your_mailjet_api_key
MJ_APIKEY_PRIVATE=your_mailjet_secret_key
MJ_FROM_EMAIL=noreply@limawaktu.id
MJ_FROM_NAME="Lima Waktu"
MJ_SMTP_HOST=in-v3.mailjet.com
MJ_SMTP_PORT=587
MJ_SMTP_SECURE=false

# === EMAIL FEATURE ===
EMAIL_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=false
EMAIL_QUEUE_BATCH_SIZE=10
```

---

## 11. Security & Compliance

1. **Rate limit** — Maks 5 email verifikasi per user per jam
2. **Token expiry** — Email verification token: 24 jam. Password reset: 1 jam
3. **Unsubscribe** — Semua email wajib punya link unsubscribe 1-klik
4. **Batas kirim Mailjet** — Mailjet Free: 200 email/hari. Pantau `email_queue.sent_at` untuk tidak overload
5. **Queue retry** — Exponential backoff sederhana via `retryCount`. Skip email setelah 3x gagal dan kirim alert ke superadmin
6. **Logging** — Semua email yg dikirim tercatat di `email_queue` + `audit_logs` untuk audit trail

---

## 12. Prioritas Implementasi

### MVP (Phase 1)

| Item | Estimasi |
|------|----------|
| Schema `email_queue`, `email_verifications`, kolom baru `users` | 1 hari |
| Migration + push Drizzle | 0.5 hari |
| Mailjet SMTP client (`send-mailjet.ts`) | 0.5 hari |
| Template: `welcome`, `email_verification` | 1 hari |
| Integrasi ke flow registrasi | 0.5 hari |
| Queue processor + cron schedule | 1 hari |
| **Total** | **4.5 hari** |

### Phase 2

- Semua template transaksional (subscription, invoice, device, prayer sync, dll.)
- Trigger cron untuk masing-masing notifikasi
- Unsubscribe flow
- Dashboard superadmin: history email, retry manual, resend

### Phase 3

- Mailjet API (bukan SMTP) untuk tracking opens/clicks
- Analytics: bounce rate, open rate, click rate
- Email template preview di superadmin UI
- Templating dengan Svelte components (SSR ke string HTML)

---

## 13. Test Strategy

| Level | Coverage |
|-------|----------|
| Unit | Template render → output contains expected values |
| Unit | `queueEmail()` → row inserted with correct data |
| Integration | `processEmailQueue()` → pending email becomes sent/failed |
| Integration | Registrasi flow → email verification token created |
| E2E | Registrasi → cek DB → email ter-queue |
| Manual | Kirim test email via Mailjet SMTP → cek inbox |

---

## 14. Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Mailjet SMTP timeout/block | Retry mechanism + fallback log + alert superadmin |
| Queue tumbuh besar (1000+) | Batch processing + index on `status` + archive sent email >30 hari |
| Email masuk spam | SPF/DKIM/DMARC setup di domain. Mailjet punya tool setup |
| User tidak menerima verifikasi email | Tampilkan tombol "Kirim ulang" + notif "Cek folder spam" |
| Email mengandung data sensitif | Jangan kirim password/token full di body. Hanya link |
