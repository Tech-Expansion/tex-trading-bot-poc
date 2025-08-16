import { Prisma } from '@prisma/client';
import { CryptoExtension } from '../../../domain/extensions/crypto';

export interface RegisterUserDto {
    telegramId: string;
    username: string;
    stakeAddress: string;
    encryptedPrivateKey: string;
    salt: string;
    addresses: string[];
}

export class CreateUserModel implements Prisma.UserUncheckedCreateInput {
    id: string;
    telegramId: string;
    username: string;
    allowAcceleratedSign: boolean;
    isDisabled: boolean;

    constructor(telegramId: string, username: string) {
        
        this.id = CryptoExtension.uuid();
        this.telegramId = telegramId;
        this.username = username;
        this.allowAcceleratedSign = true;
        this.isDisabled = false;
    }
}

export class WatchlistDto {
  telegramId: string;
  tokens: WatchlistTokenDto[];

  constructor(telegramId: string, tokens: WatchlistTokenDto[]) {
    this.telegramId = telegramId;
    this.tokens = tokens;
  }
}

export class WatchlistTokenDto {
  tokenPair: string;
  price: number;
  priceChangePercent: number | null;

  constructor(tokenPair: string, price: number, priceChangePercent: number | null = null) {
    this.tokenPair = tokenPair;
    this.price = price;
    this.priceChangePercent = priceChangePercent;
  }
}
