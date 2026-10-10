import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import postgres from "postgres";

type PostgresExecutor = {
  unsafe<T extends Record<string, unknown>[]>(
    sql: string,
    params?: unknown[]
  ): Promise<T>;
};

type PostgresDatabase = PostgresExecutor & {
  begin<T>(callback: (transaction: PostgresExecutor) => Promise<T>): Promise<T>;
};

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

export type SqlStatement = {
  sql: string;
  params: readonly unknown[];
};

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
  addisEatsPostgres?: PostgresDatabase;
  addisEatsDatabaseReady?: Promise<void>;
};

function getSqliteDatabase(): Database.Database {
  if (!globalDatabase.addisEatsDatabase) {
    const databasePath =
      process.env.ADDIS_EATS_DB_PATH ??
      (process.env.VERCEL
        ? path.join(tmpdir(), "addis-eats.sqlite")
        : path.join(process.cwd(), "data", "addis-eats.sqlite"));
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

function getPostgresDatabase(): PostgresDatabase {
  if (!globalDatabase.addisEatsPostgres) {
    const connectionString =
      process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "POSTGRES_URL or DATABASE_URL is required for durable order storage."
      );
    }

    globalDatabase.addisEatsPostgres = postgres(connectionString, {
      max: 1,
      prepare: false,
    }) as unknown as PostgresDatabase;
  }

  return globalDatabase.addisEatsPostgres;
}

async function ensurePostgresSchema(
  database: PostgresDatabase
): Promise<void> {
  if (!globalDatabase.addisEatsDatabaseReady) {
    globalDatabase.addisEatsDatabaseReady = (async () => {
      await database.unsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('customer', 'staff')),
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL
        )
      `);
      await database.unsafe(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          status TEXT NOT NULL CHECK (status IN ('received', 'preparing', 'ready', 'cancelled')),
          subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
          total INTEGER NOT NULL CHECK (total >= 0),
          created_at TEXT NOT NULL
        )
      `);
      await database.unsafe(`
        CREATE TABLE IF NOT EXISTS order_items (
          id BIGSERIAL PRIMARY KEY,
          order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          dish_id TEXT NOT NULL,
          dish_name TEXT NOT NULL,
          unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
          quantity INTEGER NOT NULL CHECK (quantity > 0)
        )
      `);
      await database.begin(async (transaction) => {
        for (const user of demoUsers) {
          await transaction.unsafe(
            `INSERT INTO users
               (id, email, name, role, password_salt, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [
              user.id,
              user.email,
              user.name,
              user.role,
              user.passwordSalt,
              user.passwordHash,
            ]
          );
        }
      });
    })().catch((error: unknown) => {
      globalDatabase.addisEatsDatabaseReady = undefined;
      throw error;
    });
  }

  await globalDatabase.addisEatsDatabaseReady;
}

function toPostgresParameters(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function run<T>(statement: SqlStatement): Promise<QueryResult<T>> {
  const postgresDatabase = process.env.VERCEL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
    ? getPostgresDatabase()
    : undefined;

  if (postgresDatabase) {
    await ensurePostgresSchema(postgresDatabase);
    const result = await postgresDatabase.unsafe<Record<string, unknown>[]>(
      toPostgresParameters(statement.sql),
      [...statement.params]
    );
    return {
      rows: result as T[],
      rowCount: result.length,
    };
  }

  const database = getSqliteDatabase();
  const prepared = database.prepare(statement.sql);
  if (/^\s*SELECT\b/i.test(statement.sql) || /\bRETURNING\b/i.test(statement.sql)) {
    const rows = prepared.all(...statement.params) as T[];
    return { rows, rowCount: rows.length };
  }

  const result = prepared.run(...statement.params);
  return { rows: [], rowCount: result.changes };
}

export async function query<T>(
  sql: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return run<T>({ sql, params });
}

export async function executeTransaction(
  statements: readonly SqlStatement[]
): Promise<void> {
  const postgresDatabase = process.env.VERCEL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
    ? getPostgresDatabase()
    : undefined;

  if (postgresDatabase) {
    await ensurePostgresSchema(postgresDatabase);
    await postgresDatabase.begin(async (transaction) => {
      for (const statement of statements) {
        await transaction.unsafe(
          toPostgresParameters(statement.sql),
          [...statement.params]
        );
      }
    });
    return;
  }

  const database = getSqliteDatabase();
  const executeAll = database.transaction(() => {
    for (const statement of statements) {
      database.prepare(statement.sql).run(...statement.params);
    }
  });
  executeAll();
}
