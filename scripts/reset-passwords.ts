import { hashPassword } from "../src/lib/server/auth/password.js";
import { db } from "../src/lib/server/db/index.js";
import { users } from "../src/lib/server/db/schema.js";
import { eq } from "drizzle-orm";

const newHash = hashPassword("change_me");

console.log("New hash:", newHash);

// Update superadmin
const r1 = await db
  .update(users)
  .set({ passwordHash: newHash })
  .where(eq(users.email, "superadmin@limawaktu.local"));
console.log("superadmin updated");

// Update admin
const r2 = await db
  .update(users)
  .set({ passwordHash: newHash })
  .where(eq(users.email, "admin@masjid.local"));
console.log("admin updated");

process.exit(0);
