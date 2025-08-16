import { Prisma, PrismaClient, TokenPairHistoryPrice } from '@prisma/client';
import { Decimal, DefaultArgs } from '@prisma/client/runtime/library';
import { TokenPairHistoryRepository } from '../../application/repositories/token-pair-history-repository';
import { PrismaBaseRepository } from './_base.repository';

export class PrismaTokenPairHistoryRepository
  extends PrismaBaseRepository<
    TokenPairHistoryPrice,
    Prisma.TokenPairHistoryPriceUncheckedCreateInput,
    Partial<TokenPairHistoryPrice>
  >
  implements TokenPairHistoryRepository
{
  private readonly _prismaClient: Prisma.TokenPairHistoryPriceDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

  constructor() {
    const currPrisma = new PrismaClient().tokenPairHistoryPrice;
    super(currPrisma);
    this._prismaClient = currPrisma;
  }
  
  async getLatestPriceByTokenPairId(tokenPairId: string): Promise<Decimal | null> {
    const latestPrice = await this._prismaClient.findFirst({
      where: { tokenPairId },
      orderBy: { timestamp: 'desc' },
      select: { price: true },
    });

    return latestPrice ? latestPrice.price : null;
  }
}
