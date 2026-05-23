import {
  bigint,
  char,
  date,
  datetime,
  decimal,
  foreignKey,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  time,
  timestamp,
  uniqueIndex,
  varchar,
  text,
} from "drizzle-orm/mysql-core";

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
};

export const roles = mysqlTable(
  "roles",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("roles_code_uq").on(table.code)],
);

export const permissions = mysqlTable(
  "permissions",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("permissions_code_uq").on(table.code)],
);

export const users = mysqlTable(
  "users",
  {
    id: char("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 24 }),
    isActive: int("is_active").default(1).notNull(),
    lastLoginAt: datetime("last_login_at"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_uq").on(table.email)],
);

export const userSessions = mysqlTable(
  "user_sessions",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    expiresAt: datetime("expires_at").notNull(),
    revokedAt: datetime("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_sessions_token_uq").on(table.token)],
);

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
    permissionId: bigint("permission_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.roleId, table.permissionId],
      name: "role_permissions_pk",
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [permissions.id],
    }).onDelete("cascade"),
  ],
);

export const userRoles = mysqlTable(
  "user_roles",
  {
    userId: char("user_id", { length: 36 }).notNull(),
    roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
      name: "user_roles_pk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
    }).onDelete("cascade"),
  ],
);

export const masjids = mysqlTable("masjids", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 120 }),
  district: varchar("district", { length: 120 }),
  province: varchar("province", { length: 120 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  timezone: varchar("timezone", { length: 64 })
    .default("Asia/Jakarta")
    .notNull(),
  hijriOffset: int("hijri_offset").default(0).notNull(),
  adzanScreenDuration: int("adzan_screen_duration").default(4).notNull(),
  khusukScreenDuration: int("khusuk_screen_duration").default(10).notNull(),
  screensaverDelayMinutes: int("screensaver_delay_minutes")
    .default(120)
    .notNull(),
  screensaverWakeMinutes: int("screensaver_wake_minutes").default(60).notNull(),
  screensaverMorningDelayMinutes: int("screensaver_morning_delay_minutes")
    .default(60)
    .notNull(),
  screensaverMorningWakeMinutes: int("screensaver_morning_wake_minutes")
    .default(120)
    .notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  isActive: int("is_active").default(1).notNull(),
  ...timestamps,
});

export const masjidUsers = mysqlTable(
  "masjid_users",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleScope: mysqlEnum("role_scope", [
      "owner",
      "admin",
      "editor",
      "operator",
      "viewer",
    ])
      .default("admin")
      .notNull(),
    isActive: int("is_active").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("masjid_users_unique").on(table.masjidId, table.userId),
  ],
);

export const devices = mysqlTable(
  "devices",
  {
    id: char("id", { length: 36 }).primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    deviceCode: varchar("device_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    orientation: mysqlEnum("orientation", ["horizontal", "vertical"])
      .default("horizontal")
      .notNull(),
    status: mysqlEnum("status", ["online", "offline", "unknown"])
      .default("unknown")
      .notNull(),
    lastSeenAt: datetime("last_seen_at"),
    pairedAt: datetime("paired_at"),
    isActive: int("is_active").default(1).notNull(),
    layoutMode: mysqlEnum("layout_mode", ["default", "youtube"])
      .default("default")
      .notNull(),
    themeId: bigint("theme_id", { mode: "number", unsigned: true }).references(
      () => themes.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [uniqueIndex("devices_code_uq").on(table.deviceCode)],
);

export const prayerProviders = mysqlTable(
  "prayer_providers",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    providerKey: varchar("provider_key", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    baseUrl: varchar("base_url", { length: 255 }),
    isActive: int("is_active").default(1).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("prayer_providers_key_uq").on(table.providerKey)],
);

export const prayerProviderLogs = mysqlTable("prayer_provider_logs", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  providerId: bigint("provider_id", {
    mode: "number",
    unsigned: true,
  }).references(() => prayerProviders.id, { onDelete: "set null" }),
  requestPath: varchar("request_path", { length: 255 }),
  requestPayload: json("request_payload"),
  responseStatus: int("response_status"),
  responsePayload: json("response_payload"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prayerCalculationMethods = mysqlTable(
  "prayer_calculation_methods",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    providerId: bigint("provider_id", {
      mode: "number",
      unsigned: true,
    }).references(() => prayerProviders.id, { onDelete: "set null" }),
    methodCode: varchar("method_code", { length: 64 }).notNull(),
    methodName: varchar("method_name", { length: 120 }).notNull(),
    params: json("params"),
    isActive: int("is_active").default(1).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("prayer_method_code_uq").on(table.methodCode)],
);

export const prayerSchedules = mysqlTable(
  "prayer_schedules",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    scheduleDate: date("schedule_date").notNull(),
    imsakTime: time("imsak_time").notNull(),
    subuhTime: time("subuh_time").notNull(),
    sunriseTime: time("sunrise_time").notNull(),
    dhuhaTime: time("dhuha_time").notNull(),
    dzuhurTime: time("dzuhur_time").notNull(),
    asharTime: time("ashar_time").notNull(),
    maghribTime: time("maghrib_time").notNull(),
    isyaTime: time("isya_time").notNull(),
    sourceProvider: varchar("source_provider", { length: 64 }),
    calculationMethod: varchar("calculation_method", { length: 64 }),
    correctionApplied: int("correction_applied").default(0).notNull(),
    isManualOverride: int("is_manual_override").default(0).notNull(),
    syncedAt: datetime("synced_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("prayer_schedules_masjid_date_uq").on(
      table.masjidId,
      table.scheduleDate,
    ),
  ],
);

export const prayerScheduleRawSources = mysqlTable(
  "prayer_schedule_raw_sources",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    scheduleDate: date("schedule_date").notNull(),
    providerKey: varchar("provider_key", { length: 64 }).notNull(),
    payload: json("payload"),
    fetchedAt: datetime("fetched_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const prayerCorrections = mysqlTable("prayer_corrections", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  prayerName: mysqlEnum("prayer_name", [
    "imsak",
    "subuh",
    "sunrise",
    "dhuha",
    "dzuhur",
    "ashar",
    "maghrib",
    "isya",
  ]).notNull(),
  offsetMinutes: int("offset_minutes").default(0).notNull(),
  reason: text("reason"),
  activeFrom: date("active_from"),
  activeUntil: date("active_until"),
  isActive: int("is_active").default(1).notNull(),
  ...timestamps,
});

export const prayerOverrides = mysqlTable(
  "prayer_overrides",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    scheduleDate: date("schedule_date").notNull(),
    prayerName: mysqlEnum("prayer_name", [
      "imsak",
      "subuh",
      "sunrise",
      "dhuha",
      "dzuhur",
      "ashar",
      "maghrib",
      "isya",
    ]).notNull(),
    overrideTime: time("override_time").notNull(),
    reason: text("reason"),
    createdBy: char("created_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("prayer_override_unique").on(
      table.masjidId,
      table.scheduleDate,
      table.prayerName,
    ),
  ],
);

export const prayerSyncJobs = mysqlTable("prayer_sync_jobs", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 }).references(() => masjids.id, {
    onDelete: "cascade",
  }),
  providerKey: varchar("provider_key", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "success", "failed"])
    .default("pending")
    .notNull(),
  startedAt: datetime("started_at"),
  finishedAt: datetime("finished_at"),
  errorMessage: text("error_message"),
  nextRetryAt: datetime("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const iqamahSettings = mysqlTable(
  "iqamah_settings",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    prayerName: mysqlEnum("prayer_name", [
      "subuh",
      "dzuhur",
      "ashar",
      "maghrib",
      "isya",
      "jumat",
    ]).notNull(),
    delayMinutes: int("delay_minutes").default(10).notNull(),
    enabled: int("enabled").default(1).notNull(),
    updatedBy: char("updated_by", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("iqamah_settings_masjid_prayer_uq").on(
      table.masjidId,
      table.prayerName,
    ),
  ],
);

export const mediaAssets = mysqlTable("media_assets", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url", { length: 255 }).notNull(),
  fileType: mysqlEnum("file_type", ["image", "video"])
    .default("image")
    .notNull(),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeBytes: bigint("size_bytes", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 160 }),
  uploadedBy: char("uploaded_by", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const slides = mysqlTable("slides", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  mediaAssetId: bigint("media_asset_id", {
    mode: "number",
    unsigned: true,
  }).references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 160 }),
  orderIndex: int("order_index").default(0).notNull(),
  startAt: datetime("start_at"),
  endAt: datetime("end_at"),
  isActive: int("is_active").default(1).notNull(),
  ...timestamps,
});

export const runningTexts = mysqlTable("running_texts", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  speed: int("speed").default(60).notNull(),
  isActive: int("is_active").default(1).notNull(),
  startAt: datetime("start_at"),
  endAt: datetime("end_at"),
  ...timestamps,
});

export const jumbotrons = mysqlTable("jumbotrons", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }),
  content: text("content"),
  backgroundUrl: varchar("background_url", { length: 255 }),
  isActive: int("is_active").default(1).notNull(),
  startAt: datetime("start_at"),
  endAt: datetime("end_at"),
  ...timestamps,
});

export const youtubeItems = mysqlTable("youtube_items", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  youtubeUrl: varchar("youtube_url", { length: 255 }).notNull(),
  title: varchar("title", { length: 160 }),
  orderIndex: int("order_index").default(0).notNull(),
  isActive: int("is_active").default(1).notNull(),
  startAt: datetime("start_at"),
  endAt: datetime("end_at"),
  ...timestamps,
});

export const events = mysqlTable("events", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  eventTime: time("event_time"),
  countdownEnabled: int("countdown_enabled").default(1).notNull(),
  isActive: int("is_active").default(1).notNull(),
  ...timestamps,
});

export const themes = mysqlTable(
  "themes",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    masjidId: char("masjid_id", { length: 36 }).references(() => masjids.id, {
      onDelete: "cascade",
    }),
    themeKey: varchar("theme_key", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    paletteJson: json("palette_json"),
    layoutJson: json("layout_json"),
    isGlobal: int("is_global").default(0).notNull(),
    isActive: int("is_active").default(1).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("themes_theme_key_uq").on(table.themeKey)],
);

export const subscriptions = mysqlTable("subscriptions", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 })
    .notNull()
    .references(() => masjids.id, { onDelete: "cascade" }),
  packageName: varchar("package_name", { length: 120 }).notNull(),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"])
    .default("monthly")
    .notNull(),
  status: mysqlEnum("status", [
    "trial",
    "active",
    "grace",
    "expired",
    "cancelled",
  ])
    .default("trial")
    .notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  price: decimal("price", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  autoRenew: int("auto_renew").default(0).notNull(),
  ...timestamps,
});

export const invoices = mysqlTable(
  "invoices",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    subscriptionId: bigint("subscription_id", {
      mode: "number",
      unsigned: true,
    })
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    masjidId: char("masjid_id", { length: 36 })
      .notNull()
      .references(() => masjids.id, { onDelete: "cascade" }),
    invoiceNo: varchar("invoice_no", { length: 80 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "pending",
      "paid",
      "failed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    dueDate: date("due_date"),
    paidAt: datetime("paid_at"),
    paymentMethod: varchar("payment_method", { length: 64 }),
    externalRef: varchar("external_ref", { length: 120 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("invoices_invoice_no_uq").on(table.invoiceNo)],
);

export const pricingPlans = mysqlTable(
  "pricing_plans",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    badge: varchar("badge", { length: 64 }),
    priceMonthly: decimal("price_monthly", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    priceYearly: decimal("price_yearly", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    priceNote: varchar("price_note", { length: 255 }),
    featuresJson: json("features_json"),
    ctaLabel: varchar("cta_label", { length: 120 })
      .default("Mulai Gratis")
      .notNull(),
    ctaHref: varchar("cta_href", { length: 255 })
      .default("/auth/login")
      .notNull(),
    isHighlight: int("is_highlight").default(0).notNull(),
    isActive: int("is_active").default(1).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("pricing_plans_name_uq").on(table.name)],
);

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  masjidId: char("masjid_id", { length: 36 }).references(() => masjids.id, {
    onDelete: "set null",
  }),
  userId: char("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  changesJson: json("changes_json"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformAnnouncements = mysqlTable("platform_announcements", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  content: text("content"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"])
    .default("info")
    .notNull(),
  targetAudience: mysqlEnum("target_audience", ["all", "admins", "superadmins"])
    .default("all")
    .notNull(),
  startAt: datetime("start_at"),
  endAt: datetime("end_at"),
  isActive: int("is_active").default(1).notNull(),
  createdBy: char("created_by", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const holidayTemplates = mysqlTable("holiday_templates", {
  id: bigint("id", { mode: "number", unsigned: true })
    .autoincrement()
    .primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  description: text("description"),
  slideConfigJson: json("slide_config_json"),
  paletteJson: json("palette_json"),
  isActive: int("is_active").default(1).notNull(),
  ...timestamps,
});

export const globalPrayerConfig = mysqlTable("global_prayer_config", {
  id: int("id").primaryKey().default(1),
  primaryProviderId: bigint("primary_provider_id", {
    mode: "number",
    unsigned: true,
  }).references(() => prayerProviders.id, { onDelete: "set null" }),
  fallbackProviderId: bigint("fallback_provider_id", {
    mode: "number",
    unsigned: true,
  }).references(() => prayerProviders.id, { onDelete: "set null" }),
  defaultMethodId: bigint("default_method_id", {
    mode: "number",
    unsigned: true,
  }).references(() => prayerCalculationMethods.id, { onDelete: "set null" }),
  defaultTimezone: varchar("default_timezone", { length: 64 })
    .default("Asia/Jakarta")
    .notNull(),
  apiKey: varchar("api_key", { length: 255 }),
  syncFrequency: mysqlEnum("sync_frequency", ["daily", "weekly", "manual"])
    .default("daily")
    .notNull(),
  syncTime: time("sync_time").default("03:00:00").notNull(),
  lockProvider: int("lock_provider").default(0).notNull(),
  lockMethod: int("lock_method").default(0).notNull(),
  updatedBy: char("updated_by", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
