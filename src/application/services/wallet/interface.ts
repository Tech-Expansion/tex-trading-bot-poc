import { Prisma, Wallet } from '@prisma/client';

export interface WalletServiceInterface {
    createWallet(data: Prisma.WalletUncheckedCreateInput): Promise<Wallet>;
    findWalletByStakeId(stakeId: string): Promise<Wallet | null>;
    findWalletsByUserId(userId: string): Promise<Wallet[]>;
    updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet | null>;
}