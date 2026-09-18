import * as dotenv from "dotenv";
dotenv.config();

import readline from "readline";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../api/_lib/schema";

const BCRYPT_ROUNDS = 12;

function ask(query: string, hide = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hide && process.stdin.isTTY) {
      // Basic terminal masking if TTY
      process.stdout.write(query);
      let input = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (chunk) => {
        const char = chunk.toString();
        if (char === "\r" || char === "\n" || char === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          rl.close();
          console.log();
          resolve(input.trim());
        } else if (char === "\u0003") {
          process.exit();
        } else if (char === "\b" || char === "\x7f") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          input += char;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

async function seedAdmin() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment or .env file.");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🔐 SMART STORE — SECURE ADMIN ACCOUNT SEEDING");
  console.log("==================================================");

  // Allow environment variables or interactive prompt
  let email = process.env.ADMIN_EMAIL || "";
  let username = process.env.ADMIN_USERNAME || "";
  let password = process.env.ADMIN_PASSWORD || "";

  if (!email) {
    email = await ask("Enter Admin Email: ");
  }
  if (!username) {
    username = await ask("Enter Admin Username: ");
  }
  if (!password) {
    password = await ask("Enter Admin Password (min 8 characters): ", true);
    const confirm = await ask("Confirm Admin Password: ", true);
    if (password !== confirm) {
      console.error("❌ ERROR: Passwords do not match.");
      process.exit(1);
    }
  }

  if (!email || !email.includes("@")) {
    console.error("❌ ERROR: Invalid email address.");
    process.exit(1);
  }
  if (!username || username.length < 3) {
    console.error("❌ ERROR: Username must be at least 3 characters.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("❌ ERROR: Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log("\n⏳ Hashing password with bcrypt (work factor 12)...");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  console.log("⏳ Connecting to database...");
  const isNeon = connectionString.includes("neon.tech");
  const pool = new Pool({
    connectionString,
    ssl: isNeon || connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });

  const db = drizzle(pool, { schema });

  try {
    const existing = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⚠️ Admin with email '${email}' already exists. Updating credentials...`);
      await db
        .update(schema.admins)
        .set({
          username,
          passwordHash,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(schema.admins.id, existing[0].id));

      await db.insert(schema.auditLogs).values({
        adminId: existing[0].id,
        adminUsername: username,
        action: "admin.updated_via_cli",
        entityType: "admin",
        entityId: existing[0].id,
        metadata: { email: email.toLowerCase() },
      });

      console.log(`✅ Administrator '${username}' updated successfully!`);
    } else {
      const [newAdmin] = await db
        .insert(schema.admins)
        .values({
          email: email.toLowerCase(),
          username,
          passwordHash,
          status: "active",
        })
        .returning();

      await db.insert(schema.auditLogs).values({
        adminId: newAdmin.id,
        adminUsername: username,
        action: "admin.seeded_via_cli",
        entityType: "admin",
        entityId: newAdmin.id,
        metadata: { email: email.toLowerCase() },
      });

      console.log(`✅ Administrator '${username}' (${email}) created successfully!`);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();

