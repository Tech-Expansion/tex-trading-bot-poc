import { Prisma, Wallet } from '@prisma/client';
import { BaseRepository } from './_base.repository';

export interface WalletRepository
  extends BaseRepository<Wallet, Prisma.WalletUncheckedCreateInput, Partial<Wallet>> {
  findByStakeId(stakeId: string): Promise<Wallet | null>;
  findByUserId(userId: string): Promise<Wallet[]>;
  findDefaultByUserId(userId: string): Promise<Wallet | null>;
}