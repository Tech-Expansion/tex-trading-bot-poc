import { CreateAddressModel } from '../application/services/address/model';
import { AddressService } from '../application/services/address/service';
import { CreateUserModel, RegisterUserDto } from '../application/services/user/model';
import { UserService } from '../application/services/user/service';
import { CreateWalletModel } from '../application/services/wallet/model';
import { WalletService } from '../application/services/wallet/service';
import AesUtils from '../domain/extensions/AesUtils';
import SessionManager from '../application/utils/session/SessionManager';
import * as BlockFrostAPI from '../infrastructure/blockfrost/blockfrost-api';
import { CommandFlow } from './base-flow';
import * as crypto from 'crypto';
import { REDIS_KEY } from '../application/helpers/constants';

const encryptPrivateKey = (
  privateKey: string,
  password: string
): { encryptedKey: string; salt: string } => {
  const aesUtils = AesUtils.getInstance();
  const salt = crypto.randomBytes(16).toString('hex');
  const saltedPassword = password + salt;
  aesUtils.generateKey(saltedPassword);
  const encryptedKey = aesUtils.encrypt(privateKey);
  return { encryptedKey, salt };
};

const storePrivateKeyToSession = async (telegramId: string, decryptedPrivateKey: string) => {
  const sessionManager = SessionManager.getInstance();
  await sessionManager.setKey(telegramId, decryptedPrivateKey, REDIS_KEY.PRIVATE_KEY);
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

const isSingleWallet = async (telegramId: string): Promise<boolean> => {
  const user = await UserService.findByTelegramId(telegramId);
  if (!user) return true;
  const wallets = await WalletService.findWalletsByUserId(user.id);
  if (!wallets || wallets.length == 0) return true;
  return false;
};

export const createAccountFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the stake address:',
      process: (state, input) => {
        state.stakeAddress = input.trim();
      },
    },
    {
      prompt: 'Please enter the password:',
      process: (state, input) => {
        state.password = input;
      },
    },
    {
      prompt: 'Please enter the private key:',
      process: (state, input) => {
        state.privateKey = input.trim();
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

      if (!state.stakeAddress || !state.password || !state.privateKey) {
        await ctx.reply('Missing required information. Please try again.');
        return;
      }

      const addresses = await BlockFrostAPI.getAddressesByStakeAddress(state.stakeAddress);
      if (!addresses || addresses.length === 0) {
        await ctx.reply('No addresses found for the provided stake address.');
        return;
      }

      const isExistStateAddress = await WalletService.findWalletByStakeId(state.stakeAddress);
      if (isExistStateAddress) {
        await ctx.reply('A wallet with this stakeId already exists.');
        return;
      }

      // encrypt private key and register wallet
      const { encryptedKey, salt } = encryptPrivateKey(state.privateKey, state.password);
      const registerUserDto: RegisterUserDto = {
        telegramId,
        username: ctx.from?.username || '',
        stakeAddress: state.stakeAddress,
        encryptedPrivateKey: encryptedKey,
        salt,
        addresses,
      };

      // Check if user already exists, if not create new one
      let user = await UserService.findByTelegramId(telegramId);
      let userId: string;
      if (!user) {
        const result = await createUser(registerUserDto);
        userId = result.userId;
      } else {
        userId = user.id;
      }

      // Create wallet and address
      const { walletId } = await createWallet(userId, registerUserDto);
      await createAddress(walletId, registerUserDto);

      // store privateKey to session
      await storePrivateKeyToSession(telegramId, state.privateKey);
      await ctx.reply(`Create successfully. Type '/login' to login wallet`);
    } catch (error) {
      console.error('Finalize Error:', error);
      await ctx.reply(`❌ Failed to create account. Try again!`);
    }
  },
};

export const usePrivateKeyFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please confirm to retrieve your private key: 1 (Confirm), 2 (Cancel)',
      process: (state, input) => {
        state.onOk = input;
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

      const sessionManager = SessionManager.getInstance();
      const privateKey = await sessionManager.getKey(telegramId, REDIS_KEY.PRIVATE_KEY);

      if (!privateKey) {
        await ctx.reply('No private key found in session. Please register or log in again.');
        return;
      }

      // Safely display the privateKey: show first 3 characters, then ***, then last 5 characters
      let maskedPrivateKey: string;

      if (privateKey.length <= 8) {
        // If the privateKey is 8 characters or shorter, show partial start and end with *** in the middle
        maskedPrivateKey = `${privateKey.slice(0, Math.min(3, privateKey.length))}***${privateKey.slice(-Math.min(5, privateKey.length))}`;
      } else {
        // For longer keys, show the first 3 and last 5 characters with *** in between
        maskedPrivateKey = `${privateKey.slice(0, 3)}***${privateKey.slice(-5)}`;
      }

      await ctx.reply(`Your private key from session: ${maskedPrivateKey}`);
    } catch (error) {
      console.error('Use Private Key Error:', error);
      await ctx.reply(`Failed to retrieve private key. Try again!`);
    }
  },
};

export const loginFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter your stake address:',
      process: (state, input) => {
        state.stakeAddress = input.trim();
      },
      skip: async (state) => await isSingleWallet(state.from?.id),
    },
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

      if (!state.stakeAddress) {
        await ctx.reply('Stake address is required. Please try again.');
        return;
      }

      if (!state.password) {
        await ctx.reply('Password is required. Please try again.');
        return;
      }

      const user = await UserService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('User not found. Please register first.');
        return;
      }

      const wallet = await WalletService.findWalletByStakeId(state.stakeAddress);
      if (!wallet) {
        await ctx.reply('No wallet found for this stake address. Please register a wallet.');
        return;
      }

      if (!wallet.hashedKey || !wallet.salt) {
        await ctx.reply('Wallet data is incomplete. Please contact support.');
        return;
      }

      const aesUtils = AesUtils.getInstance();
      const saltedPassword = state.password + wallet.salt;
      aesUtils.generateKey(saltedPassword);
      let decryptedPrivateKey: string;
      try {
        decryptedPrivateKey = aesUtils.decrypt(wallet.hashedKey);
      } catch (error: any) {
        if (error.message.includes('bad decrypt')) {
          await ctx.reply('Incorrect password. Please try again.');
          return;
        }
        throw error;
      }

      storePrivateKeyToSession(telegramId, decryptedPrivateKey);
      await ctx.reply(`Welcome back, ${user.username}!`);
    } catch (error) {
      console.error('Login Error:', error);
      await ctx.reply(`❌ Login failed. Try again !`);
    }
  },
};
