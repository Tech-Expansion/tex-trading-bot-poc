import { PrismaClient } from "@prisma/client";
import { UnitOfWork } from "../../application/repositories/_unit-of-work";
import { prismaClient } from "../../infrastructure/prisma/prisma-client";
import { BaseRepository } from "../../application/repositories/_base.repository";

export class PrismaUnitOfWork<Repositories extends Record<string, BaseRepository<any, any, any>>>
  implements UnitOfWork<Repositories>
{
  private readonly repositories: Repositories;

  constructor(
    private readonly prisma: PrismaClient,
    repositories: Repositories
  ) {
    this.repositories = repositories;
  }

  async transaction<T = unknown>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (prisma) => {
      for (const repository of Object.keys(this.repositories)) {
        this.repositories[repository].transacting(prisma);
      }
      const result = await fn(this.repositories);
      for (const repository of Object.keys(this.repositories)) {
        this.repositories[repository].transacting(null);
      }
      return result;
    });
  }
}

export const makeUnitOfWork = <Repositories extends Record<string, BaseRepository<any, any, any>>>(
  repositories: Repositories
) => {
  return new PrismaUnitOfWork<Repositories>(prismaClient, repositories);
};
