import { Bot } from 'grammy';
import { setupEventListeners } from './application/events/setup-event-listeners';
import { BOT_TOKEN } from './application/helpers/constants';
import './application/jobs/order-processor';
import './application/jobs/poll-tx-confirm';
import SessionManager from './application/utils/session/SessionManager';
import { logger } from './domain/extensions/logger';
import { handleFlowInput, startFlow } from './presentation/base-flow';
import {
  createOrderFlow,
  orderHistoryFlow,
  orderInfoFlow,
  orderStatusFlow,
  pricingFlow,
} from './presentation/order-flow';
import { createAccountFlow, loginFlow, usePrivateKeyFlow } from './presentation/user-flow';
import {
  watchlistAddFlow,
  watchlistFlow,
  watchlistRemoveFlow,
} from './presentation/watchlist-flow';
import { setupMenu } from './presentation/menu';

async function main() {
  const bot = new Bot(BOT_TOKEN);
  setupMenu(bot);
  setupEventListeners();

  bot.command('start', (ctx) => {
    ctx.reply('Welcome to tex bot!. Type /menu to see the commands.');
  });

  //#region Swapping
  bot.command('swap', (ctx) => {
    startFlow(ctx, createOrderFlow);
  });

  bot.command('pricing', async (ctx) => {
    startFlow(ctx, pricingFlow);
  });
  //#endregion

  //#region User
  bot.command('register', (ctx) => {
    startFlow(ctx, createAccountFlow);
  });

  bot.command('login', (ctx) => {
    startFlow(ctx, loginFlow);
  });

  bot.command('privateKey', (ctx) => {
    startFlow(ctx, usePrivateKeyFlow);
  });
  //#endregion

  //#region watchlist
  bot.command('wl', (ctx) => {
    startFlow(ctx, watchlistFlow);
  });

  bot.command('wladd', (ctx) => {
    startFlow(ctx, watchlistAddFlow);
  });

  bot.command('wlremove', (ctx) => {
    startFlow(ctx, watchlistRemoveFlow);
  });
  //#endregion

  //#region order
  bot.command('orderStatus', (ctx) => {
    startFlow(ctx, orderStatusFlow);
  });

  bot.command('orderInfo', (ctx) => {
    startFlow(ctx, orderInfoFlow);
  });

  bot.command('orderHistory', (ctx) => {
    startFlow(ctx, orderHistoryFlow);
  });
  //#endregion

  //#region Exit
  bot.command('exit', async (ctx) => {
    ctx.reply('Exiting...');
    if (ctx.from?.id) {
      SessionManager.getInstance().removeSession(ctx.from.id.toString());
    }
    setTimeout(() => {
      ctx.reply('Bye!');
      process.exit(0);
    }, 100);
  });
  //#endregion

  bot.on('message:text', handleFlowInput);

  setTimeout(() => {
    bot.start();
  }, 1000);
}

main().catch(logger.error);
