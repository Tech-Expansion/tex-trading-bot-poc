import { UserTokenPairWatch } from '@prisma/client';
import { AssetPair } from '../../types/asset-pair';

export interface TokenPairServiceInterface {
  getTokenPairIdByPairName(tokenPair: string): Promise<string>;
  getAssetPairByName(tokenPair: string): Promise<AssetPair>;
  getPriceChangePercent(
    tokenPairId: string,
    currentPrice: number,
    comparedTime: number
  ): Promise<number | null>;
  addTokenPairToWatchlist(userId: string, tokenPairName: string): Promise<UserTokenPairWatch>;
  removeTokenPairFromWatchlist(userId: string, tokenPairName: string): Promise<boolean>;
}
