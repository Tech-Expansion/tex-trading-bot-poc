import { Prisma } from '@prisma/client';
import { PrismaTokenRepository } from '../../../persistence/repositories/token-repository';
import { TokenRepository } from '../../repositories/token-repository';
import { TokenServiceInterface } from './interface';
import { CryptoExtension } from '../../../domain/extensions/crypto';
import { getAssetNameFromAssetHexName } from '../../../domain/extensions/asset-common-functions';

class TokenServiceClass implements TokenServiceInterface {
  constructor(private tokenRepository: TokenRepository) {}

  async createToken(
    policyId: string,
    tokenHexName: string
  ): Promise<Prisma.TokenUncheckedCreateInput> {
    const tokenName = getAssetNameFromAssetHexName(tokenHexName);

    const newToken: Prisma.TokenUncheckedCreateInput = {
      id: CryptoExtension.uuid(),
      policyId,
      tokenHexName: tokenHexName,
      tokenName,
    };

    await this.tokenRepository.create(newToken);
    return newToken;
  }
}

const tokenRepository = new PrismaTokenRepository();
export const TokenService = new TokenServiceClass(tokenRepository);
