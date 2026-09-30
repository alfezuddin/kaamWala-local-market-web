import type { MockDatabase } from "./seed";
import { buildDatabase } from "./seed";

const DB_KEY = "kaamwala.db.v1";

let cache: MockDatabase | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read(): MockDatabase | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockDatabase;
  } catch {
    return null;
  }
}

/**
 * Returns the local mock database, creating and persisting it on first use.
 *
 * On the server (static generation, metadata) this builds a throwaway
 * in-memory copy; in the browser it is seeded into localStorage once and
 * reused for the rest of the session.
 */
export function getDb(): MockDatabase {
  if (cache) return cache;
  if (!canUseStorage()) {
    cache = buildDatabase();
    return cache;
  }
  const stored = read();
  cache = stored ?? buildDatabase();
  if (!stored) persist(cache);
  return cache;
}

function persist(db: MockDatabase) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable — keep working with the in-memory copy */
  }
}

/** Applies a mutation to the database and persists the result. */
export function mutate<T>(fn: (db: MockDatabase) => T): T {
  const db = getDb();
  const result = fn(db);
  cache = db;
  persist(db);
  if (canUseStorage()) {
    try {
      window.dispatchEvent(new CustomEvent("kaamwala:db-changed"));
    } catch {
      /* noop */
    }
  }
  return result;
}

export function resetDb() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DB_KEY);
  cache = null;
}

export function nextId(prefix: string, list: { id: string }[]) {
  const max = list.reduce((acc, item) => {
    const n = Number(item.id.split("-").pop());
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}
