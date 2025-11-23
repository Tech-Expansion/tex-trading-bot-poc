import { Blockfrost, Lucid } from '@spacebudz/lucid';
import { generateMnemonic } from 'bip39';
import { InlineKeyboard } from 'grammy';
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_PROJECT_ID,
  REDIS_KEY,
  REDIS_TTL,
} from '../application/helpers/constants';
import { CreateAddressModel } from '../application/services/address/model';
import { AddressService } from '../application/services/address/service';
import { CreateUserModel, RegisterUserDto } from '../application/services/user/model';
import { UserService } from '../application/services/user/service';
import { CreateWalletModel } from '../application/services/wallet/model';
import { WalletService } from '../application/services/wallet/service';
import SessionManager from '../application/utils/session/SessionManager';
import AesUtils from '../domain/extensions/AesUtils';
import { CommandFlow } from './base-flow';

const aesUtils = AesUtils.getInstance();

// Create inline keyboard for terms agreement
const termsKeyboard = new InlineKeyboard()
  .text('✅ I Agree', 'I Agree')
  .text('❌ I Do Not Agree', 'I Do Not Agree');

export const createAccountV2Flow: CommandFlow = {
  steps: [
    {
      prompt: `
      📜 Terms of Agreement – Cardano Trading Bot

      1. Wallet Creation & Asset Management  
        - The bot will automatically create a Cardano wallet for each user.  
        - You are fully responsible for securely storing your seed phrase/private key (if provided).  
        - We are NOT liable for any loss caused by leaking or misplacing your seed phrase/private key.  

      2. Trading Risks  
        - All blockchain transactions on Cardano are IRREVERSIBLE.  
        - You are solely responsible for all trading actions made through this bot.  
        - Token prices are highly volatile and may result in a total or partial loss of assets.  

      3. Limitation of Liability  
        - The bot only serves as a trading tool.  
        - We do NOT guarantee profits and are NOT responsible for any direct or indirect losses.  

      4. Privacy & Security  
        - The bot may store minimal user data (e.g., Telegram ID, wallet address) for functionality.  
        - Seed phrases/private keys will never be stored in plain text.  
        - By using this bot, you agree that some transaction data may be analyzed to improve the service.  

      5. Acceptance of Terms  
        - By using this bot, you automatically accept these Terms of Agreement.  
        - If you do not agree, please stop using the bot.  

      ⚠️ By pressing "I Agree", you confirm that you have read, understood, and accepted these terms.

      Please choose your response:`,
      keyboard: termsKeyboard,
      validate: (input) => ['I Agree', 'I Do Not Agree'].includes(input),
      process: (state, input) => {
        state.termsAccepted = input === 'I Agree';
      },
    },
    {
      prompt: 'Please enter a password to secure your wallet:',
      process: (state, input) => {
        state.password = input;
      },
    },
    {
      prompt: 'Please confirm your password:',
      process: (state, input) => {
        state.confirmPassword = input;
      },
      jumpToStep: (state, input) => {
        // If passwords don't match, jump back to password step (index 1)
        if (state.password !== input) {
          delete state.password; // Clear the previous password
          delete state.confirmPassword; // Clear confirm password
          return 1; // Jump back to the password step
        }
        return null; // Continue to next step
      },
      validate: (input) => {
        return input.trim().length > 0;
      },
    },
  ],
  finalize: async (ctx, state) => {
    try {
      if (!state.termsAccepted) {
        await ctx.reply(
          `❌ You have declined the Terms of Agreement. The bot session will now end. 
          
          If you want to join in the future, just type /start and accept the terms. See you soon.`
        );
        await ctx.reply('👋 Goodbye!');
        return;
      }

      await ctx.reply(
        '✅ Thank you for accepting our Terms of Agreement. Creating your account...'
      );

      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) {
        await ctx.reply('Could not identify your Telegram ID.');
        return;
      }

      const lucid = new Lucid({
        provider: new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
      });

      // 1. Generate seed phrase (mnemonic)
      const mnemonic = generateMnemonic(256); // 256 bits for 24 words
      lucid.selectWalletFromSeed(mnemonic);

      const address = await lucid.wallet.address();
      const stakeId = await lucid.wallet.rewardAddress();

      const { encryptedKey, salt } = aesUtils.encryptPrivateKey(mnemonic, state.password);

      const registerUserDto: RegisterUserDto = {
        telegramId,
        username: ctx.from?.username || 'TEXer',
        stakeAddress: stakeId!,
        encryptedPrivateKey: encryptedKey,
        salt,
        addresses: [address],
      };
      const { userId } = await createUser(registerUserDto);
      const { walletId } = await createWallet(userId, registerUserDto);
      await createAddress(walletId, registerUserDto);

      await storePrivateKeyToSession(telegramId, mnemonic);

      await ctx.reply('🎉 Account created successfully!');
    } catch (error) {
      console.error('Error in createAccountV2Flow:', error);
      await ctx.reply('❌ An error occurred while creating your account. Please try again later.');
    }
  },
};

const createUser = async (dto: RegisterUserDto): Promise<{ userId: string }> => {
  const userData = new CreateUserModel(dto.telegramId, dto.username);
  const user = await UserService.createUser(userData);

  if (!user) {
    throw new Error('Failed to create user');
  }

  return { userId: user.id };
};

const createWallet = async (
  userId: string,
  dto: RegisterUserDto
): Promise<{ walletId: string }> => {
  // Create wallet
  const walletData = new CreateWalletModel(
    userId,
    dto.stakeAddress,
    dto.encryptedPrivateKey,
    dto.salt
  );
  const wallet = await WalletService.createWallet(walletData);
  return { walletId: wallet.id };
};

const createAddress = async (walletId: string, dto: RegisterUserDto) => {
  // Create address for the given stake address
  const addressData = dto.addresses.map((address) => new CreateAddressModel(walletId, address));
  await AddressService.createAddresses(addressData);
};

const storePrivateKeyToSession = async (telegramId: string, decryptedPrivateKey: string) => {
  const sessionManager = SessionManager.getInstance();
  await sessionManager.setKey(
    telegramId,
    decryptedPrivateKey,
    REDIS_KEY.PRIVATE_KEY,
    REDIS_TTL.OneDay
  );
};

export const getSeedPhrase: CommandFlow = {
  steps: [
    {
      prompt: 'Please confirm to retrieve your private key: 1 (Confirm), 2 (Cancel)',
      process: (state, input) => {
        state.onOk = input;
      },
    },
    {
      prompt: 'Please enter the password:',
      process: (state, input) => {
        state.password = input;
      },
    },
  ],
  finalize: async (ctx, state) => {
    try {
      if (state.onOk === '2') {
        await ctx.reply('⚠️ Action has been canceled.');
        return;
      }

      const telegramId = ctx.from?.id?.toString();

      if (!telegramId) {
        await ctx.reply('Could not identify your Telegram ID.');
        return;
      }

      const privateKey = await WalletService.getDecryptedPrivateKey(telegramId, state.password);

      await ctx.reply(`Please delete the message ASAP, your private key is: 
        ${privateKey}`);
    } catch (error) {
      console.error('Use Private Key Error:', error);
      await ctx.reply(`Failed to retrieve private key. Try again!`);
    }
  },
};

export const loginFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter your password:',
      process: (state, input) => {
        state.password = input;
      },
    },
  ],
  finalize: async (ctx, state) => {
    try {
      const telegramId = ctx.from?.id?.toString();

      if (!telegramId) {
        await ctx.reply('Could not identify your Telegram ID.');
        return;
      }

      if (!state.password) {
        await ctx.reply('Password is required. Please try again.');
        return;
      }

      const privateKey = await WalletService.getDecryptedPrivateKey(telegramId, state.password);

      const user = await UserService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('User not found. Please register first.');
        return;
      }

      storePrivateKeyToSession(telegramId, privateKey);
      await ctx.reply(`Welcome back, ${user.username}!`);
    } catch (error: any) {
      if (error.message.includes('bad decrypt')) {
        await ctx.reply('Incorrect password. Please try again.');
        return;
      }
      console.error('Login Error:', error);
      await ctx.reply(`❌ Login failed. Try again !`);
    }
  },
};
