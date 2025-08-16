import { Prisma, User, Wallet } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { REDIS_KEY } from '../application/helpers/constants';
import { OrderService } from '../application/services/order/service';
import { TokenPairService } from '../application/services/token-pair/service';
import { UserService } from '../application/services/user/service';
import { WalletService } from '../application/services/wallet/service';
import { OrderStatus, OrderType } from '../application/types/enums';
import SessionManager from '../application/utils/session/SessionManager';
import { CommandFlow } from './base-flow';
import { CommonService } from '../application/services/common/service';

export const createOrderFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the token pair (e.g., ADA/MIN):',
      process: (state, input) => {
        state.tokenPairName = input;
      },
    },
    {
      prompt: 'Select the order type (Market or Limit):',
      validate: (input) => ['Market', 'Limit'].includes(input),
      process: (state, input) => {
        state.orderType = input;
      },
    },
    {
      prompt: 'Enter the amount:',
      validate: (input) => !isNaN(Number(input)),
      process: (state, input) => {
        state.amount = input;
      },
    },
    {
      prompt: 'Enter the slippage:',
      validate: (input) => !isNaN(Number(input)),
      process: (state, input) => {
        state.slippage = input;
      },
    },
    {
      prompt: 'Enter the limit price (only for Limit orders):',
      validate: (input) => !isNaN(Number(input)),
      process: (state, input) => {
        state.limitPrice = input;
      },
      skip: (state) => state.orderType !== 'Limit',
    },
  ],
  finalize: async (ctx, state) => {
    try {
      let telegramId = ctx.from?.id?.toString();
      if (!telegramId) {
        await ctx.reply('❗ Unable to identify user.');
        return;
      }
      const sessionManager = SessionManager.getInstance();
      const stakeId = await sessionManager.getKey(telegramId, REDIS_KEY.STAKE_ID);

      let wallet: Wallet | null = null;

      if (stakeId) {
        wallet = await WalletService.findWalletByStakeId(stakeId);
      }

      if (!wallet) {
        const user = await getCurrentUser(telegramId);
        if (!user || !user.id) {
          await ctx.reply('❗ User account not found.');
          return;
        }

        wallet = await WalletService.findDefaultWalletByUserId(user.id);
      }

      if (!wallet || !wallet.id) {
        await ctx.reply('❗ No wallet found for your account.');
        return;
      }

      const tokenPairId = await TokenPairService.getTokenPairIdByPairName(state.tokenPairName);

      const currentDate = new Date();
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(currentDate.getMonth() + 1);
      const order: Prisma.OrderUncheckedCreateInput = {
        walletId: wallet.id,
        tokenPairId: tokenPairId,
        orderType: state.orderType === 'Market' ? OrderType.Market : OrderType.Limit,
        status: OrderStatus.PENDING,
        amount: new Decimal(state.amount),
        slippage: new Decimal(state.slippage),
        limitPrice: state.orderType === 'Limit' ? new Decimal(state.limitPrice) : null,
        expirationTime: nextMonthDate,
        createdAt: currentDate,
      };

      await OrderService.createOrder(order);

      await ctx.reply(
        `✅ <b>Order Summary</b>\n- Token Pair: ${state.tokenPairName}\n- Order Type: ${state.orderType}\n- Amount: ${state.amount}\n- Slippage: ${state.slippage}${state.orderType === 'Limit' ? `\n- Limit Price: ${state.limitPrice}` : ''}\n\n<b>Order created successfully!</b>`,
        {
          parse_mode: 'HTML',
        }
      );
    } catch (error) {
      await ctx.reply(`❗ Failed to create order: ${(error as { message: string }).message}`);
    }
  },
};

export const orderInfoFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the order code (e.g., OR240105001):',
      process: (state, input) => {
        state.orderCode = input.trim();
      },
    },
  ],
  finalize: async (ctx, state) => {
    try {
      const order = await OrderService.getOrderByCode(state.orderCode);
      if (!order) {
        await ctx.reply(`❗ Order not found with code ${state.orderCode}`);
        return;
      }

      const message =
        `📦 <b>Order:</b> ${order.orderCode}\n` +
        `Status: ${OrderStatus[order.status] ?? order.status}\n` +
        `Pair: ${order.tokenpair?.tokenA?.tokenName ?? 'Unknown'} / ${order.tokenpair?.tokenB?.tokenName ?? 'Unknown'}\n` +
        `Amount: ${order.amount}\n` +
        `Created At: ${order.createdAt.toLocaleString()}`;

      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (error) {
      await ctx.reply(`❗ Failed to retrieve order: ${(error as { message: string }).message}`);
    }
  },
};

export const pricingFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the token pair (e.g., ADA/MIN):',
      process: (state, input) => {
        state.tokenPairName = input;
      },
    },
  ],
  finalize: async (ctx, state) => {
    try {
      const assetPair = await TokenPairService.getAssetPairByName(state.tokenPairName);
      const currentPrice = await CommonService.getTokenPairPrice(assetPair);

      ctx.reply(`🚀 ${state.tokenPairName}: ${currentPrice}`);
    } catch (error) {
      ctx.reply(`Something went wrong: ${(error as { message: string }).message}`);
    }
  },
};

export const orderStatusFlow: CommandFlow = {
  steps: [],
  finalize: async (ctx) => {
    const statuses = OrderService.getOrderStatusList();

    const statusEmojiMap = {
      PENDING: '✅',
      PROCESSING: '🔄',
      COMPLETED: '🎉',
      CANCELLED: '❌',
      FAILED: '⚠️',
      EXPIRED: '⏰',
    };

    const message = statuses
      .map(
        (s) =>
          `${statusEmojiMap[s.key as keyof typeof statusEmojiMap] || '📄'} <b>${s.key}</b> (${s.value})`
      )
      .join('\n');

    await ctx.reply(`📋 <b>Order Status List</b>\n\n${message}`, {
      parse_mode: 'HTML',
    });
  },
};

export const orderHistoryFlow: CommandFlow = {
  steps: [],
  finalize: async (ctx) => {
    const user = await getCurrentUser(ctx.from?.id?.toString());
    if (!user.id) {
      await ctx.reply('❗ Unable to identify user.');
      return;
    }

    const orders = await OrderService.getOrderHistoryByUser(user.id);
    if (orders.length === 0) {
      await ctx.reply(
        'ℹ️ <b>No orders found!</b>\nYou haven’t placed any orders yet.\n\n👉 Use /swap to start a new order!',
        {
          parse_mode: 'HTML',
        }
      );
      return;
    }

    const message = orders
      .map(
        (o, idx) =>
          `#${idx + 1}\n<b>Code:</b> ${o.orderCode}\n\n<b>Status:</b> ${o.status}\n<b>Pair:</b> ${o.tokenPair}\n<b>Amount:</b> ${o.amount}\n<b>Created At:</b> ${o.createdAt.toLocaleString()}`
      )
      .join('\n\n');

    await ctx.reply(`<b>📜 Your Order History</b>\n\n${message}`, {
      parse_mode: 'HTML',
    });
  },
};

const getCurrentUser = async (telegramId?: string): Promise<User> => {
  if (!telegramId) {
    throw new Error('Telegram ID not found');
  }

  const user = await UserService.findByTelegramId(telegramId);
  if (!user) {
    throw new Error(`User with Telegram ID ${telegramId} not found`);
  }

  return user;
};
