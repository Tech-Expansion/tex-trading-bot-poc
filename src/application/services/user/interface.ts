import { Prisma, User } from "@prisma/client";
import { WatchlistDto } from "./model";

export interface UserServiceInterface {
	createUser(user: Prisma.UserUncheckedCreateInput): Promise<User | null>;
	findByTelegramId(telegramId: string): Promise<User | null>;
	updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User | null>;
	getWatchlist(telegramId: string): Promise<WatchlistDto | null>;
}