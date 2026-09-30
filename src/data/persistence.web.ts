import { parseRecord, type AppRecord } from '../domain/model';
import type { Repository } from './sqlite-repository';
let instance: Promise<Repository> | undefined;
export function openRepository(): Promise<Repository> {
  return (instance ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('mobile-barcode-inventory', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('records', { keyPath: 'id' });
    request.onerror = () => {
      instance = undefined;
      reject(
        new Error(
          'Browser storage could not open. Allow site storage and retry.',
        ),
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        list: () =>
          new Promise<AppRecord[]>((ok, fail) => {
            const tx = db.transaction('records', 'readonly');
            const q = tx.objectStore('records').getAll();
            q.onsuccess = () => {
              try {
                ok(q.result.map(parseRecord));
              } catch (e) {
                fail(e);
              }
            };
            q.onerror = () => fail(q.error);
          }),
        save: (record, previousRevision) =>
          new Promise<void>((ok, fail) => {
            const tx = db.transaction('records', 'readwrite');
            const store = tx.objectStore('records');
            let conflict = false;
            let invalid: unknown;
            const q = store.get(record.id);
            q.onsuccess = () => {
              const existing = q.result as AppRecord | undefined;
              if (
                (existing?.revision ?? 0) !== previousRevision ||
                record.revision !== previousRevision + 1
              ) {
                conflict = true;
                tx.abort();
                return;
              }
              try {
                store.put(parseRecord(record));
              } catch (e) {
                invalid = e;
                tx.abort();
              }
            };
            tx.oncomplete = () => ok();
            tx.onabort = () =>
              fail(
                invalid ??
                  new Error(
                    conflict
                      ? 'This record changed in another tab. Reload before retrying.'
                      : 'Could not save. Check available device storage and retry.',
                  ),
              );
            tx.onerror = () => fail(tx.error);
          }),
        remove: (ids) =>
          new Promise<void>((ok, fail) => {
            const tx = db.transaction('records', 'readwrite');
            for (const id of ids) tx.objectStore('records').delete(id);
            tx.oncomplete = () => ok();
            tx.onabort = () => fail(tx.error);
            tx.onerror = () => fail(tx.error);
          }),
      });
    };
  }));
}
