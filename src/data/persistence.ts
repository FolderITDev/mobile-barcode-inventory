import { openDatabaseAsync } from 'expo-sqlite';
import {
  initialize,
  sqliteRepository,
  type Repository,
} from './sqlite-repository';
let instance: Promise<Repository> | undefined;
export function openRepository(): Promise<Repository> {
  return (instance ??= (async () => {
    try {
      const db = await openDatabaseAsync('mobile-barcode-inventory.db');
      await initialize(db);
      return sqliteRepository(db);
    } catch (e) {
      instance = undefined;
      throw e;
    }
  })());
}
