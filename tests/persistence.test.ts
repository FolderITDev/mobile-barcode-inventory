import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  initialize,
  sqliteRepository,
  type SqlDatabase,
} from '../src/data/sqlite-repository';
import { receivingCount } from './fixtures';
function adapter(db: DatabaseSync): SqlDatabase {
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...params) {
      return { changes: Number(db.prepare(sql).run(...params).changes) };
    },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
  };
}
test('migration, durable restart and optimistic concurrency', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'folder-mobile-'));
  const path = join(directory, 'test.db');
  let db = new DatabaseSync(path);
  try {
    await initialize(adapter(db));
    const repo = sqliteRepository(adapter(db));
    const record = receivingCount();
    await repo.save(record, 0);
    await assert.rejects(() => repo.save(record, 0));
    db.close();
    db = new DatabaseSync(path);
    await initialize(adapter(db));
    const reopened = sqliteRepository(adapter(db));
    assert.deepEqual(await reopened.list(), [record]);
    const next = { ...record, revision: 2 };
    await reopened.save(next, 1);
    await assert.rejects(() => reopened.save(next, 1), /changed elsewhere/);
    assert.deepEqual(await reopened.list(), [next]);
    await reopened.remove([record.id]);
    assert.deepEqual(await reopened.list(), []);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test('a newer schema is rejected without destructive reset', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA user_version=99');
  await assert.rejects(() => initialize(adapter(db)), /newer app/);
  db.close();
});
test('malformed persisted data is surfaced, not silently overwritten', async () => {
  const db = new DatabaseSync(':memory:');
  await initialize(adapter(db));
  db.exec(`INSERT INTO records VALUES ('bad',1,'{}')`);
  await assert.rejects(() => sqliteRepository(adapter(db)).list());
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM records').get()?.n, 1);
  db.close();
});
