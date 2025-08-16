import { Prisma, PrismaClient, Token } from '@prisma/client';
import { PrismaBaseRepository } from './_base.repository';
import { TokenRepository } from '../../application/repositories/token-repository';
import { Asset } from '@minswap/sdk';
import { DefaultArgs } from '@prisma/client/runtime/library';

export class PrismaTokenRepository
  extends PrismaBaseRepository<Token, Prisma.TokenUncheckedCreateInput, Partial<Token>>
  implements TokenRepository
{
  private readonly _prismaClient: Prisma.TokenDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

  constructor() {
    const currPrisma = new PrismaClient().token;
    super(currPrisma);
    this._prismaClient = currPrisma;
  }
}
