import { Prisma, Wallet } from '@prisma/client';
import AesUtils from '../../../domain/extensions/AesUtils';
import { PrismaWalletRepository } from '../../../persistence/repositories/wallet-repository';
import { WalletRepository } from '../../repositories/wallet-repository';
import { WalletServiceInterface } from './interface';

class WalletServiceClass implements WalletServiceInterface {
  constructor(private walletRepository: WalletRepository) {}

  async createWallet(data: Prisma.WalletUncheckedCreateInput): Promise<Wallet> {
    const existingWalletByStakeId = await this.walletRepository.findByStakeId(data.stakeId);
    if (existingWalletByStakeId) {
      throw new Error('A wallet with this stakeId already exists.');
    }

    return await this.walletRepository.create(data);
  }

  async findWalletByStakeId(stakeId: string): Promise<Wallet | null> {
    return await this.walletRepository.findByStakeId(stakeId);
  }

  async findWalletsByUserId(userId: string): Promise<Wallet[]> {
    return await this.walletRepository.findByUserId(userId);
  }

  async findDefaultWalletByUserId(userId: string): Promise<Wallet | null> {
    return await this.walletRepository.findDefaultByUserId(userId);
  }

  async updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet | null> {
    return await this.walletRepository.update(id, data);
  }

  async getDecryptedPrivateKey(telegramId: string, password: string = ''): Promise<string> {
    const encryptedKey = await this.walletRepository.getEncryptedPrivateKeyByTelegramId(telegramId);
    if (!encryptedKey.encryptedPrivateKey || !encryptedKey.salt) {
      throw new Error('Encrypted private key or salt is missing.');
    }

    const aesUtils = AesUtils.getInstance();
    const decryptedPrivateKey = aesUtils.decryptPrivateKey(
      encryptedKey.encryptedPrivateKey,
      encryptedKey.salt,
      password
    );

    return decryptedPrivateKey;
  }
}

const walletRepository = new PrismaWalletRepository();
export const WalletService = new WalletServiceClass(walletRepository);
