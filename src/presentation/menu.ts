import { Bot, InlineKeyboard } from 'grammy';
import { startFlow } from './base-flow';
import { createAccountFlow, loginFlow, usePrivateKeyFlow } from './user-flow';
import { createOrderFlow, orderHistoryFlow, orderStatusFlow, pricingFlow } from './order-flow';
import { watchlistAddFlow, watchlistFlow, watchlistRemoveFlow } from './watchlist-flow';

export function setupMenu(bot: Bot) {
  // Main menu
  bot.command('menu', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('👤 Profile', 'menu_profile')
      .text('📈 Trading', 'menu_trading')
      .text('👀 Watchlist', 'menu_watchlist');

    await ctx.reply('✨ *Choose a category:*', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Profile submenu
  bot.callbackQuery('menu_profile', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('📝 Register', 'profile_register')
      .text('🔐 Login', 'profile_login')
      .text('🔑 Private Key', 'profile_privateKey')
      .row()
      .text('🔙 Back to Menu', 'menu_back');

    await ctx.editMessageText('👤 *Profile Menu:*', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Trading submenu
  bot.callbackQuery('menu_trading', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('💰 Pricing', 'trading_pricing')
      .text('🔄 Swap', 'trading_swapping')
      .text('📜 History', 'trading_swappingHistory')
      .text('📜 Order book', 'trading_swappingStatus')
      .row()
      .text('🔙 Back to Menu', 'menu_back');

    await ctx.editMessageText('📈 *Trading Menu:*', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Watchlist submenu
  bot.callbackQuery('menu_watchlist', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('📋 View', 'watchlist_wl')
      .text('➕ Add Pair', 'watchlist_wladd')
      .text('➖ Remove Pair', 'watchlist_wlremove')
      .row()
      .text('🔙 Back to Menu', 'menu_back');

    await ctx.editMessageText('👀 *Watchlist Menu:*', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Back to main menu
  bot.callbackQuery('menu_back', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('👤 Profile', 'menu_profile')
      .text('📈 Trading', 'menu_trading')
      .text('👀 Watchlist', 'menu_watchlist');

    await ctx.editMessageText('✨ *Choose a category:*', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // Profile actions
  bot.callbackQuery('profile_register', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, createAccountFlow);
  });

  bot.callbackQuery('profile_login', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, loginFlow);
  });

  bot.callbackQuery('profile_privateKey', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, usePrivateKeyFlow);
  });

  // Trading actions
  bot.callbackQuery('trading_swapping', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, createOrderFlow);
  });

  bot.callbackQuery('trading_swappingHistory', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, orderHistoryFlow);    
  });

  bot.callbackQuery('trading_swappingStatus', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, orderStatusFlow);    
  });

  bot.callbackQuery('trading_pricing', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, pricingFlow);
  });

  // Watchlist actions
  bot.callbackQuery('watchlist_wl', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, watchlistFlow);
  });

  bot.callbackQuery('watchlist_wladd', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, watchlistAddFlow);
  });

  bot.callbackQuery('watchlist_wlremove', async (ctx) => {
    await ctx.answerCallbackQuery();
    startFlow(ctx, watchlistRemoveFlow);
  });
}
