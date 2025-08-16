import { TokenPairService } from '../application/services/token-pair/service';
import { UserService } from '../application/services/user/service';
import { CommandFlow } from './base-flow';

export const watchlistFlow: CommandFlow = {
  steps: [],
  finalize: async (ctx) => {
    try {
      const telegramId = ctx.from?.id?.toString();

      if (!telegramId) {
        throw new Error('Telegram ID not found');
      }

      const watchlist = await UserService.getWatchlist(telegramId);

      if (!watchlist || watchlist.tokens.length === 0) {
        ctx.reply('Your watchlist is empty.');
        return;
      }

      const replyMessage =
        `Your tokens and 1 Hour change:\n\n` +
        watchlist.tokens
          .map((token) => {
            const price = token.price.toFixed(4); // Format price to 4 decimal places
            const change = token.priceChangePercent?.toFixed(2) ?? '0.00'; // Format change
            const changeSymbol = token.priceChangePercent && token.priceChangePercent > 0 ? '+' : '';
            const icon = token.priceChangePercent && token.priceChangePercent > 0 ? '📈' : '📉';

            return `${token.tokenPair} is $${price} ${changeSymbol}${change}% ${icon}`;
          })
          .join('\n');

      // Send the reply
      ctx.reply(replyMessage);
    } catch (error) {
      console.error('Error in watchlist flow:', error);
      ctx.reply('An error occurred while fetching your watchlist.');
    }
  },
};

export const watchlistAddFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the token pair you wish to add (e.g., ADA/MIN): ',
      process: (state, input) => {
        state.tokenPair = input.trim();
      },
    },
  ],
  finalize: async (ctx, state) => {
    const userId = await getUserId(ctx.from?.id?.toString());

    const tokenPair = state.tokenPair;
    if (!tokenPair) {
      ctx.reply('Token pair is required.');
      return;
    }

    try {
      const token = await TokenPairService.addTokenPairToWatchlist(userId, tokenPair);

      if (token) {
        ctx.reply(`Token pair ${tokenPair} added to your watchlist.`);
      } else {
        ctx.reply(`${tokenPair} is not a valid token pair.`);
      }
    } catch (error) {
      console.error('Error adding token to watchlist:', error);
      ctx.reply('An error occurred while adding the token to your watchlist.');
    }
  },
};

export const watchlistRemoveFlow: CommandFlow = {
  steps: [
    {
      prompt: 'Please enter the token pair you wish to remove (e.g., ADA/MIN): ',
      process: (state, input) => {
        state.tokenPair = input.trim();
      },
    },
  ],
  finalize: async (ctx, state) => {
    const userId = await getUserId(ctx.from?.id?.toString());
    const tokenPair = state.tokenPair;
    if (!tokenPair) {
      ctx.reply('Token pair is required.');
      return;
    }

    try {
      const token = await TokenPairService.removeTokenPairFromWatchlist(userId, tokenPair);

      if (token) {
        ctx.reply(`Token pair ${tokenPair} removed from your watchlist.`);
      } else {
        ctx.reply(`Your watchlist doesn't contain ${tokenPair}.`);
      }
    }
    catch (error) {
      console.error('Error removing token from watchlist:', error);
      ctx.reply('An error occurred while removing the token from your watchlist.');
    }
  },
};

const getUserId = async (telegramId?: string): Promise<string> => {
  if (!telegramId) {
    throw new Error('Telegram ID not found');
  }

  const user = await UserService.findByTelegramId(telegramId);
  if (!user || !user.id) {
    throw new Error(`User with Telegram ID ${telegramId} not found`);
  }

  return user.id;
};