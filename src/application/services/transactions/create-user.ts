import { Prisma } from '@prisma/client';
import { CryptoExtension } from '../../../domain/extensions/crypto';
import { prismaClient } from '../../../infrastructure/prisma/prisma-client';

class CreateUserUseCase {
  async perform(): Promise<void> {
    var userId = CryptoExtension.uuid(); // Generate a unique ID for the user

    const user: Prisma.UserUncheckedCreateInput = {
      id: userId,
      telegramId: '123456789',
      username: 'finntrinh-transaction-v1',
      allowAcceleratedSign: true,
      isDisabled: false,
      createdAt: new Date(),
    };

    const wallets: Prisma.WalletUncheckedCreateInput[] = [
      {
        userId: userId, // Link the wallet to the user
        stakeId: 'stake1uxxxxxxxxxxxxxxx11',
        hashedKey: 'hashedKey11',
      },
      {
        userId: userId, // Link the wallet to the user
        stakeId: 'stake1uxxxxxxxxxxxxxxx22',
        hashedKey: 'hashedKey22',
      },
    ];

    await prismaClient.$transaction(async (transactionClient) => {
      // Create the user
      await transactionClient.user.create({ data: user });

      // Simulate an error to test rollback
      throw new Error('Simulating an error during user creation for rollback testing');

      // Create the wallets
      for (const wallet of wallets) {
        await transactionClient.wallet.create({ data: wallet });
      }
    });
  }
}

export const CreateUserTransaction = new CreateUserUseCase();
