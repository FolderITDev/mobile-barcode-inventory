import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { parseRecord, type AppRecord } from '../domain/model';
import { message } from '../domain/validation';
import { openRepository } from './persistence';

type Status =
  { kind: 'loading' } | { kind: 'ready' } | { kind: 'failed'; error: string };

interface Store {
  records: AppRecord[];
  status: Status;
  retry: () => void;
  /** Each mutation resolves only after the durable write succeeded. */
  add: (record: AppRecord) => Promise<void>;
  change: (id: string, fn: (record: AppRecord) => AppRecord) => Promise<void>;
  remove: (ids: string[]) => Promise<void>;
}

const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AppRecord[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  /** Latest committed records, readable inside queued tasks without stale closures. */
  const committed = useRef(records);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const publish = useCallback((next: AppRecord[]) => {
    committed.current = next;
    setRecords(next);
  }, []);

  useEffect(() => {
    let live = true;
    openRepository()
      .then((repo) => repo.list())
      .then((rows) => {
        if (!live) return;
        publish(rows);
        setStatus({ kind: 'ready' });
      })
      .catch((e) => {
        if (live) setStatus({ kind: 'failed', error: message(e) });
      });
    return () => {
      live = false;
    };
  }, [attempt, publish]);

  /** Serializes writes so each one reads the result of the previous one. */
  const serial = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const result = queue.current.then(task);
    queue.current = result.catch(() => undefined);
    return result;
  }, []);

  const add = useCallback(
    (record: AppRecord) =>
      serial(async () => {
        const valid = parseRecord(record);
        const repo = await openRepository();
        await repo.save(valid, 0);
        publish([valid, ...committed.current]);
      }),
    [serial, publish],
  );

  const change = useCallback(
    (id: string, fn: (record: AppRecord) => AppRecord) =>
      serial(async () => {
        const old = committed.current.find((r) => r.id === id);
        if (!old) throw new Error('This count no longer exists.');
        const next = parseRecord({
          ...fn(old),
          id: old.id,
          revision: old.revision + 1,
          updatedAt: new Date().toISOString(),
        });
        const repo = await openRepository();
        await repo.save(next, old.revision);
        publish(committed.current.map((r) => (r.id === id ? next : r)));
      }),
    [serial, publish],
  );

  const remove = useCallback(
    (ids: string[]) =>
      serial(async () => {
        const repo = await openRepository();
        await repo.remove(ids);
        publish(committed.current.filter((r) => !ids.includes(r.id)));
      }),
    [serial, publish],
  );

  const retry = useCallback(() => {
    setStatus({ kind: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ records, status, retry, add, change, remove }),
    [records, status, retry, add, change, remove],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStore(): Store {
  const store = useContext(Context);
  if (!store) throw new Error('useStore must be used inside StoreProvider.');
  return store;
}

export function useRecord(id: string | undefined): AppRecord | undefined {
  const { records } = useStore();
  return useMemo(() => records.find((r) => r.id === id), [records, id]);
}
