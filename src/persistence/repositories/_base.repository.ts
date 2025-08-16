import { Prisma, PrismaClient } from '@prisma/client';
import { Transaction } from './_base.transaction';
import { BaseRepository } from '../../application/repositories/_base.repository';

export class PrismaBaseRepository<TModel, TCreateInput, TUpdateInput>
    implements BaseRepository<TModel, TCreateInput, TUpdateInput> {
    private tx: Transaction | null = null;
    private model: any;

    constructor(model: any) {
        this.model = model;
    }
    transacting(transaction: Transaction | null): void {
        this.tx = transaction;
    }

    protected get unitOfWork(): Transaction | PrismaClient {
        return this.tx ?? new PrismaClient();
    }

    async get(id: string): Promise<TModel | null> {
        return await this.model.findUnique({ where: { id } });
    }

    async create(data: TCreateInput): Promise<TModel> {
        return await this.model.create({ data });
    }

    async createMany(data: { data: TCreateInput[] }): Promise<void> {
        await this.model.createMany(data);
    }

    async update(id: string, data: TUpdateInput): Promise<TModel | null> {
        return await this.model.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<TModel | null> {
        return await this.model.delete({ where: { id } });
    }

    async findAll(): Promise<TModel[]> {
        return await this.model.findMany();
    }

    async findByField(field: keyof TModel, value: any): Promise<TModel[]> {
        return await this.model.findMany({ where: { [field]: value } });
    }

    async count(): Promise<number> {
        return await this.model.count();
    }
}
