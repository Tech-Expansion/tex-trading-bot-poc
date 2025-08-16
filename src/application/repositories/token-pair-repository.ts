import { Prisma, TokenPair, UserTokenPairWatch } from '@prisma/client';
import { AssetPair, AssetPairDto } from '../types/asset-pair';
import { BaseRepository } from './_base.repository';

export interface TokenPairRepository
  extends BaseRepository<TokenPair, Prisma.TokenPairUncheckedCreateInput, Partial<TokenPair>> {
  getTokenPairIdByPairName(tokenPair: string): Promise<string>;
  getAssetPair(tokenPairId: string, includePairName?: boolean): Promise<AssetPairDto>;
  getAssetPairByName(tokenPair: string): Promise<AssetPair>;
  getMaxSequenceByUser(userId: string): Promise<number>;
  getPriceChangePercent(tokenPairId: string, currentPrice: number, comparedTime: number): Promise<number | null>;
  addTokenPairToWatchlist(userId: string, tokenPairId: string): Promise<UserTokenPairWatch>;
  removeTokenPairFromWatchlist(userId: string, tokenPairId: string): Promise<boolean>;
}
