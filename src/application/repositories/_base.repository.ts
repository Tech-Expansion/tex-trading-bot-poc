export interface BaseRepository<TModel, TCreateInput, TUpdateInput> {
  transacting(transaction: unknown): void;
  get(id: string): Promise<TModel | null>;
  create(data: TCreateInput): Promise<TModel>;
  createMany(data: { data: TCreateInput[] }): Promise<void>;
  update(id: string, data: TUpdateInput): Promise<TModel | null>;
  delete(id: string): Promise<TModel | null>;
  findAll(): Promise<TModel[]>;
  findByField(field: keyof TModel, value: any): Promise<TModel[]>;
  count(): Promise<number>;
}

export type RepositoryPick<
  T extends BaseRepository<any, any, any>,
  K extends keyof BaseRepository<any, any, any>,
> = Pick<T, K | 'transacting'>;