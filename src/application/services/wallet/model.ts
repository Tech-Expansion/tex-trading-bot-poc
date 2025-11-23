import { Prisma } from '@prisma/client';
import { CryptoExtension } from '../../../domain/extensions/crypto';

export class CreateWalletModel implements Prisma.WalletUncheckedCreateInput {
  id: string;
  userId: string;
  stakeId: string;
  hashedKey: string;
  salt: string;

  constructor(userId: string, stakeAddress: string, encryptedPrivateKey: string, salt: string) {
    this.id = CryptoExtension.uuid();
    this.userId = userId;
    this.stakeId = stakeAddress;
    this.hashedKey = encryptedPrivateKey;
    this.salt = salt;
  }
}

export type EncryptedPrivateKey = {
  encryptedPrivateKey: string | null;
  salt: string | null;
};
