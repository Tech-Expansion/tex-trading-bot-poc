import { Prisma, User } from '@prisma/client';
import { UserRepository } from '../../repositories/user-repository';
import { UserServiceInterface } from './interface';
import { PrismaUserRepository } from '../../../persistence/repositories/user-repository';
import { WatchlistDto, WatchlistTokenDto } from './model';
import { TokenPairRepository } from '../../repositories/token-pair-repository';
import { CommonService } from '../common/service';
import { PrismaTokenPairRepository } from '../../../persistence/repositories/token-pair-repository';
import { UNKNOWN_TOKEN } from '../../helpers/constants';
import { TokenPairService } from '../token-pair/service';

class UserServiceClass implements UserServiceInterface {
  constructor(
    private userRepository: UserRepository,
    private tokenPairRepository: TokenPairRepository
  ) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return await userRepository.findByTelegramId(telegramId);
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User | null> {
    return await userRepository.update(id, data);
  }

  async createUser(user: Prisma.UserUncheckedCreateInput): Promise<User | null> {
    if (!user.telegramId) {
      throw new Error('Telegram ID is required');
    }

    const existingUser = await this.userRepository.findByTelegramId(user.telegramId);
    if (existingUser) {
      throw new Error('User with this Telegram ID already exists');
    }

    return this.userRepository.create(user);
  }

  async getWatchlist(telegramId: string): Promise<WatchlistDto | null> {
    const tokenPairIds = await this.userRepository.getWatchlistTokenPairIds(telegramId);

    const watchlistTokens = await Promise.all(
      tokenPairIds.map(async (tokenPairId) => {
        const assetPair = await this.tokenPairRepository.getAssetPair(tokenPairId, true);
        const currentPrice = await CommonService.getTokenPairPrice(assetPair);
        const priceChangePercent = await TokenPairService.getPriceChangePercent(
          tokenPairId,
          Number(currentPrice)
        );
  
        return new WatchlistTokenDto(
          assetPair.tokenPairName ?? UNKNOWN_TOKEN,
          Number(currentPrice),
          priceChangePercent
        );
      })
    );

    return new WatchlistDto(telegramId, watchlistTokens);
  }
}

const userRepository = new PrismaUserRepository();
const tokenPairRepository = new PrismaTokenPairRepository();
export const UserService = new UserServiceClass(userRepository, tokenPairRepository);
