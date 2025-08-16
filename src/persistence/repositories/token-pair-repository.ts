import { Prisma, PrismaClient, TokenPair, UserTokenPairWatch } from '@prisma/client';
import { PrismaBaseRepository } from './_base.repository';
import { TokenPairRepository } from '../../application/repositories/token-pair-repository';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { Asset } from '@minswap/sdk';
import { AssetPair, AssetPairDto } from '../../application/types/asset-pair';
import { prismaClient } from '../../infrastructure/prisma/prisma-client';

export class PrismaTokenPairRepository
  extends PrismaBaseRepository<TokenPair, Prisma.TokenPairUncheckedCreateInput, Partial<TokenPair>>
  implements TokenPairRepository
{
  private readonly _prismaClient: Prisma.TokenPairDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

  constructor() {
    const currPrisma = new PrismaClient().tokenPair;
    super(currPrisma);
    this._prismaClient = currPrisma;
  }
  async getTokenPairIdByPairName(tokenPair: string): Promise<string> {
    const [assetAName, assetBName] = tokenPair.split('/');

    return await this._prismaClient
      .findFirst({
        where: {
          tokenA: {
            tokenName: assetAName,
          },
          tokenB: {
            tokenName: assetBName,
          },
        },
        select: {
          id: true,
        },
      })
      .then((tokenPair) => {
        if (!tokenPair) {
          throw new Error(`Token pair ${tokenPair} not found`);
        }

        return tokenPair.id;
      });
  }

  async getAssetPair(tokenPairId: string, includePairName?: boolean): Promise<AssetPairDto> {
    // Fetch the token pair from the database
    const tokenPair = await this._prismaClient.findUnique({
      where: {
        id: tokenPairId,
      },
      include: {
        tokenA: true,
        tokenB: true,
      },
    });

    if (!tokenPair) {
      throw new Error(`Token pair with id ${tokenPairId} not found`);
    }

    const assetA: Asset = {
      policyId: tokenPair.tokenA.policyId,
      tokenName: tokenPair.tokenA.tokenHexName,
    };

    const assetB: Asset = {
      policyId: tokenPair.tokenB.policyId,
      tokenName: tokenPair.tokenB.tokenHexName,
    };

    if (includePairName === true) {
      return {
        assetA,
        assetB,
        tokenPairName: `${tokenPair.tokenA.tokenName}/${tokenPair.tokenB.tokenName}`,
        isMainPair: tokenPair.isMainPair,
      };
    }

    return { assetA, assetB, isMainPair: tokenPair.isMainPair, tokenPairName: null };
  }

  async getAssetPairByName(tokenPair: string): Promise<AssetPair> {
    const [assetAName, assetBName] = tokenPair.split('/');

    return await this._prismaClient
      .findFirst({
        where: {
          tokenA: {
            tokenName: assetAName,
          },
          tokenB: {
            tokenName: assetBName,
          },
        },
        include: {
          tokenA: true,
          tokenB: true,
        },
      })
      .then((tokenPair) => {
        if (!tokenPair) {
          throw new Error(`Token pair ${tokenPair} not found`);
        }

        const assetA: Asset = {
          policyId: tokenPair.tokenA.policyId,
          tokenName: tokenPair.tokenA.tokenHexName,
        };

        const assetB: Asset = {
          policyId: tokenPair.tokenB.policyId,
          tokenName: tokenPair.tokenB.tokenHexName,
        };

        return { assetA, assetB, isMainPair: tokenPair.isMainPair };
      });
  }

  async getMaxSequenceByUser(userId: string): Promise<number> {
    const result = await prismaClient.userTokenPairWatch.aggregate({
      where: {
        userId: userId,
      },
      _max: {
        sequence: true,
      },
    });
  
    return result._max.sequence || 0; // Return the max sequence or 0 if none exists
  }

  async getPriceChangePercent(tokenPairId: string, comparedTime: number, currentPrice: number): Promise<number | null> {
    const historyPrice = await prismaClient.tokenPairHistoryPrice.findFirst({
      where: {
        tokenPairId: tokenPairId,
        timestamp: {
          gte: new Date(Date.now() - comparedTime),
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        price: true,
      },
    });

    if (!historyPrice) return null;

    const priceChangePercent = ((currentPrice - Number(historyPrice.price)) / Number(historyPrice.price)) * 100;
    return priceChangePercent;
  }

  async addTokenPairToWatchlist(userId: string, tokenPairId: string): Promise<UserTokenPairWatch> {  
    const maxSequence = await this.getMaxSequenceByUser(userId);

    const newWatchingToken: Prisma.UserTokenPairWatchUncheckedCreateInput = {
      userId: userId,
      tokenPairId: tokenPairId,
      sequence: maxSequence + 1,
    };

    const createdTokenPair = await prismaClient.userTokenPairWatch.create({
      data: newWatchingToken
    });

    return createdTokenPair;
  }
  
  async removeTokenPairFromWatchlist(userId: string, tokenPairId: string): Promise<boolean> {
    
    const result = await prismaClient.userTokenPairWatch.deleteMany({
      where: {
        userId: userId,
        tokenPairId: tokenPairId,
      },
    });
  
    return result.count > 0;
  }
}
