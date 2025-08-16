import { Prisma, User } from '@prisma/client';
import { BaseRepository } from './_base.repository';

export interface UserRepository
  extends BaseRepository<User, Prisma.UserUncheckedCreateInput, Partial<User>> {
  findByTelegramId(telegramId: string): Promise<User | null>;

  createUser(data: Prisma.UserUncheckedCreateInput): Promise<User | null>;

  updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User | null>;

  getWatchlistTokenPairIds(telegramId: string): Promise<Array<string>>;
}
