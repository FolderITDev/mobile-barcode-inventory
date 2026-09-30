import { parseRecord, type AppRecord } from '../domain/model';
export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<{ changes: number }>;
  getAllAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T[]>;
  getFirstAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T | null>;
}
export interface Repository {
  list(): Promise<AppRecord[]>;
  save(record: AppRecord, previousRevision: number): Promise<void>;
  remove(ids: string[]): Promise<void>;
}
export const schema = `CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL CHECK(revision>0), payload TEXT NOT NULL CHECK(json_valid(payload)));`;
export async function initialize(db: SqlDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  if ((row?.user_version ?? 0) > 1)
    throw new Error(
      'This data was saved by a newer app. Update the app to continue.',
    );
  if ((row?.user_version ?? 0) === 0) {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      await db.execAsync(schema);
      await db.execAsync('PRAGMA user_version=1; COMMIT;');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  }
}
export function sqliteRepository(db: SqlDatabase): Repository {
  return {
    async list() {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM records',
      );
      return rows.map((row) => parseRecord(JSON.parse(row.payload)));
    },
    async save(record, previousRevision) {
      const validated = parseRecord(record);
      if (validated.revision !== previousRevision + 1)
        throw new Error('Invalid revision transition.');
      if (previousRevision === 0) {
        await db.runAsync(
          'INSERT INTO records(id,revision,payload) VALUES(?,?,?)',
          validated.id,
          validated.revision,
          JSON.stringify(validated),
        );
        return;
      }
      const result = await db.runAsync(
        'UPDATE records SET revision=?,payload=? WHERE id=? AND revision=?',
        validated.revision,
        JSON.stringify(validated),
        validated.id,
        previousRevision,
      );
      if (result.changes !== 1)
        throw new Error(
          'This record changed elsewhere. Reopen the app to reload before retrying.',
        );
    },
    async remove(ids) {
      if (!ids.length) return;
      await db.execAsync('BEGIN IMMEDIATE');
      try {
        for (const id of ids)
          await db.runAsync('DELETE FROM records WHERE id=?', id);
        await db.execAsync('COMMIT');
      } catch (e) {
        await db.execAsync('ROLLBACK');
        throw e;
      }
    },
  };
}
