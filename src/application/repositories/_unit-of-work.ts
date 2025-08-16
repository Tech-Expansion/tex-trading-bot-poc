import { BaseRepository } from "./_base.repository";

export type Transaction = unknown;

export interface UnitOfWork<Repositories extends Record<string, BaseRepository<any, any, any>>> {
  transaction: <T = unknown>(fn: (repositories: Repositories) => Promise<T>) => Promise<T>;
}
