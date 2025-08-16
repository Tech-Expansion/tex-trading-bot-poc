import { Bot } from 'grammy';
import { BOT_TOKEN } from '../helpers/constants';
import { OrderStatusChangedEvent } from '../../domain/events/event-models';

const bot = new Bot(BOT_TOKEN);

export const sendOrderStatusNotification = async (event: OrderStatusChangedEvent) => {
  const chatId = event.telegramId;

  // Handle different statuses
  let message = '';
  switch (event.status) {
    case 1: // PENDING
      message = `🕒 Order ${event.orderId} is now PENDING.`;
      break;
    case 2: // PROCESSING
      message = `⚙️ Order ${event.orderId} is being PROCESSED.`;
      break;
    case 3: // COMPLETED
      message = `✅ Order ${event.orderId} has been COMPLETED successfully!`;
      break;
    case 4: // CANCELLED
      message = `❌ Order ${event.orderId} has been CANCELLED.`;
      break;
    case 5: // FAILED
      message = `⚠️ Order ${event.orderId} FAILED.`;
      break;
    case 6: // EXPIRED
      message = `⌛ Order ${event.orderId} has EXPIRED.`;
      break;
    default:
      message = `ℹ️ Order ${event.orderId} status: ${event.status}`;
      break;
  }

  await bot.api.sendMessage(chatId, message);
};