import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

export const DB_NAME = "flashcard_deutsch.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) dbPromise = openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export function execAsync(sql: string, params: any[] = []): Promise<void> {
  return getDb().then((d) => {
    if (params.length === 0) return d.execAsync(sql);
    // SQLite execAsync doesn't accept params; fallback to runAsync for parameterized statements
    return d.runAsync(sql, params).then(() => undefined);
  });
}

export function runAsync(sql: string, params: any[] = []): Promise<void> {
  return getDb().then((d) => d.runAsync(sql, params).then(() => undefined));
}

export function allAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return getDb().then((d) => d.getAllAsync<T>(sql, params));
}
