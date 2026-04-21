/**
 * One-time seed: creates the first admin user.
 * Run: npm run db:seed --workspace=packages/backend
 *
 * Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env before running.
 */
// Load .env before any module that reads process.env (db client, etc.)
// Using require so dotenv runs before the pg Pool is constructed
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: require("path").resolve(process.cwd(), "../../.env") });

import bcrypt from "bcrypt";

async function seed() {
  // Dynamic import ensures the Pool is created after dotenv has loaded
  const { db } = await import("./client");

  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@acefone.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const hash = await bcrypt.hash(password, 12);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     SELECT $1, $2, $3, r.id FROM roles r WHERE r.name = 'admin'
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email`,
    [name, email, hash]
  );

  if (rows.length === 0) {
    console.log(`Admin user ${email} already exists — skipping.`);
  } else {
    console.log(`✅ Admin created: ${rows[0].email} (id: ${rows[0].id})`);
    console.log(`   Login with password: ${password}`);
  }

  await db.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
