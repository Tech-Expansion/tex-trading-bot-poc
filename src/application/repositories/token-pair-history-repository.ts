import { Prisma, TokenPairHistoryPrice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseRepository } from './_base.repository';

export interface TokenPairHistoryRepository
    extends BaseRepository<TokenPairHistoryPrice, Prisma.TokenPairHistoryPriceUncheckedCreateInput, Partial<TokenPairHistoryPrice>> {
    getLatestPriceByTokenPairId(tokenPairId: string): Promise<Decimal | null>;
}
