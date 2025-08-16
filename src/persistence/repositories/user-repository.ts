import { Prisma, User } from '@prisma/client';
import { PrismaBaseRepository } from './_base.repository';
import { prismaClient } from '../../infrastructure/prisma/prisma-client';
import { UserRepository } from '../../application/repositories/user-repository';

export class PrismaUserRepository
  extends PrismaBaseRepository<User, Prisma.UserUncheckedCreateInput, Prisma.UserUpdateInput>
  implements UserRepository {
  private readonly _prismaClient = prismaClient.user;

  constructor() {
    super(prismaClient.user);
  }

  async createUser(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.create(data);
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return await this._prismaClient.findFirst({
      where: { telegramId: telegramId },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User | null> {
    return this.update(id, data);
  }

  async getWatchlistTokenPairIds(telegramId: string): Promise<Array<string>> {
    const tokenPairs = await this._prismaClient.findMany({
      where: { telegramId: telegramId },
      select: {
        watchedTokenPairs: {
          select: {
            tokenPairId: true,
          },
        },
      },
    });
    
    return tokenPairs.flatMap((tokenPair) =>
      tokenPair.watchedTokenPairs.map((watchedTokenPair) => watchedTokenPair.tokenPairId)
    );
  }
}
