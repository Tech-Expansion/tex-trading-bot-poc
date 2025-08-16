import { Prisma, Wallet } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { WalletRepository } from '../../application/repositories/wallet-repository';
import { prismaClient } from '../../infrastructure/prisma/prisma-client';
import { PrismaBaseRepository } from './_base.repository';

export class PrismaWalletRepository
  extends PrismaBaseRepository<Wallet, Prisma.WalletUncheckedCreateInput, Partial<Wallet>>
  implements WalletRepository {
  private readonly _prismaClient: Prisma.WalletDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

  constructor() {
    super(prismaClient.wallet);
    this._prismaClient = prismaClient.wallet;
  }

  async findByStakeId(stakeId: string): Promise<Wallet | null> {
    return await this._prismaClient.findFirst({
      where: { stakeId },
    });
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return await this._prismaClient.findMany({
      where: { userId },
    });
  }

  async findDefaultByUserId(userId: string): Promise<Wallet | null> {
    return await this._prismaClient.findFirst({
      where: { userId },
    });
  }
}