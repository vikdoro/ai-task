// One writer at a time per open database, within this process.
// recordPoll opens a transaction across awaits; any other write on the same connection while it is open
// would join it, so poll.ts runs recordPoll under this lock and lib/delivery/ writes only under it too.
import type { Db } from '../storage/db.ts';

const locks = new WeakMap<Db, Promise<unknown>>();

export function withDbLock<T>(db: Db, fn: () => Promise<T> | T): Promise<T> {
  const prev = locks.get(db) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  locks.set(db, next);
  return next;
}
