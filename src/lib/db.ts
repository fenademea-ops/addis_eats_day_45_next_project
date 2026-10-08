import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const demoUsers = [
  {
    id: "usr_customer",
    email: "customer@addiseats.local",
    name: "Demo Customer",
    role: "customer",
    passwordSalt: "c8abd49e3e0f66e675ae50f9fdf9de53",
    passwordHash:
      "ad7a2022d556c0fa4f41977689a4013607a62c404669592d8234cc3209700d8c95652e142703d25f035177cf995ec47b6f3f4097f7d477f5837c1f168fa98995",
  },
  {
    id: "usr_kitchen",
    email: "kitchen@addiseats.local",
    name: "Demo Kitchen Staff",
    role: "staff",
    passwordSalt: "09086ed9b9a703340bac6841072d5497",
    passwordHash:
      "37c6ece21e15c5a64929f828df600bb75de656741a293fe17245b5265cb1ce8c02101d6b4b6860fc6e55b5bbf27f1d16d597edfeaf135aa1883f6ff4a181cd98",
  },
] as const;

const globalDatabase = globalThis as typeof globalThis & {
  addisEatsDatabase?: Database.Database;
};

export function getDatabase(): Database.Database {
  if (!globalDatabase.addisEatsDatabase) {
    const databasePath =
      process.env.ADDIS_EATS_DB_PATH ??
      path.join(process.cwd(), "data", "addis-eats.sqlite");
    mkdirSync(path.dirname(databasePath), { recursive: true });

    const database = new Database(databasePath);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('customer', 'staff')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL CHECK (status IN ('received', 'preparing', 'ready', 'cancelled')),
        subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
        total INTEGER NOT NULL CHECK (total >= 0),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        dish_id TEXT NOT NULL,
        dish_name TEXT NOT NULL,
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0)
      );
    `);

    const insertUser = database.prepare(`
      INSERT OR IGNORE INTO users
        (id, email, name, role, password_salt, password_hash)
      VALUES
        (@id, @email, @name, @role, @passwordSalt, @passwordHash)
    `);
    const seedUsers = database.transaction(() => {
      for (const user of demoUsers) {
        insertUser.run(user);
      }
    });
    seedUsers();
    globalDatabase.addisEatsDatabase = database;
  }

  return globalDatabase.addisEatsDatabase;
}
