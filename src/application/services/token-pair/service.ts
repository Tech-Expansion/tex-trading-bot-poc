import { UserTokenPairWatch } from "@prisma/client";
import { PrismaTokenPairRepository } from "../../../persistence/repositories/token-pair-repository";
import { DEFAULT_COMPARED_TIME } from "../../helpers/constants";
import { TokenPairRepository } from "../../repositories/token-pair-repository";
import { AssetPair } from "../../types/asset-pair";
import { TokenPairServiceInterface } from "./interface";

class TokenPairServiceClass implements TokenPairServiceInterface {
  constructor(private tokenPairRepository: TokenPairRepository) { }

  async getTokenPairIdByPairName(tokenPair: string): Promise<string> {
    return this.tokenPairRepository.getTokenPairIdByPairName(tokenPair);
  }

  async getAssetPairByName(tokenPair: string): Promise<AssetPair> {
    return this.tokenPairRepository.getAssetPairByName(tokenPair);
  }

  async getPriceChangePercent(tokenPairId: string, currentPrice: number, comparedTime: number = DEFAULT_COMPARED_TIME): Promise<number | null> {
    return await this.tokenPairRepository.getPriceChangePercent(tokenPairId, currentPrice, comparedTime);
  }

  async addTokenPairToWatchlist(userId: string, tokenPairName: string): Promise<UserTokenPairWatch> {
    const tokenPairId = await this.tokenPairRepository.getTokenPairIdByPairName(tokenPairName);
    if (!tokenPairId) {
      throw new Error(`Token pair ${tokenPairName} not found`);
    }

    return this.tokenPairRepository.addTokenPairToWatchlist(userId, tokenPairId);
  }

  async removeTokenPairFromWatchlist(userId: string, tokenPairName: string): Promise<boolean> {
    const tokenPairId = await this.tokenPairRepository.getTokenPairIdByPairName(tokenPairName);
    if (!tokenPairId) {
      throw new Error(`Token pair ${tokenPairName} not found`);
    }

    return this.tokenPairRepository.removeTokenPairFromWatchlist(userId, tokenPairId);
  }
}

const tokenPairRepository = new PrismaTokenPairRepository();
export const TokenPairService = new TokenPairServiceClass(tokenPairRepository);
