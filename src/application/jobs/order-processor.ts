import Big from 'big.js';
import _ from 'lodash';
import cron from 'node-cron';
import { CommonService } from '../../application/services/common/service';
import { OrderStatus, OrderType } from '../../application/types/enums';
import RedisClient from '../../infrastructure/redis/redis';
import { PrismaAddressRepository } from '../../persistence/repositories/address-repository';
import { PrismaOrderRepository } from '../../persistence/repositories/order-repository';
import { PrismaTokenPairRepository } from '../../persistence/repositories/token-pair-repository';
import { OrderService } from '../services/order/service';
import { PrismaTokenPairHistoryRepository } from '../../persistence/repositories/token-pair-history-response';

const orderRepository = new PrismaOrderRepository();
const tokenPairRepository = new PrismaTokenPairRepository();
const tokenPairHistoryRepository = new PrismaTokenPairHistoryRepository();
const addressRepository = new PrismaAddressRepository();
const redisClient = RedisClient.getInstance();

async function getSafeCurrentPrice(tokenPairId: string): Promise<Big | null> {
  const dbPrice = await tokenPairHistoryRepository.getLatestPriceByTokenPairId(tokenPairId);
  if (dbPrice) {
    return Big(dbPrice.toString());
  }

  const assetPair = await tokenPairRepository.getAssetPair(tokenPairId);
  if (!assetPair) {
    console.error(`Asset pair not found for tokenPairId: ${tokenPairId}`);
    return null;
  }

  const chainPrice = await CommonService.getTokenPairPrice(assetPair);
  console.log(`Using on-chain price for tokenPair ${tokenPairId}`);
  return chainPrice;
}

async function processPendingOrders() {
  const pendingOrders = (await orderRepository.getPendingOrders()) ?? [];
  const groupedByWallet = _.groupBy(pendingOrders, (o) => o.walletId);

  for (const [walletId, orders] of Object.entries(groupedByWallet)) {
    const lockKey = `wallet:${walletId}:locked`;
    const waitingKey = `wallet:${walletId}:waiting_for_confirm`;
    const isLocked = await redisClient.get(lockKey);
    const waitingTx = await redisClient.get(waitingKey);

    if (isLocked === 'true' || waitingTx) {
      console.log(`⏳ Wallet ${walletId} is locked or waiting confirm, skipping...`);
      continue;
    }

    await redisClient.set(lockKey, 'true');
    console.log(`🔒 Locking wallet ${walletId} in Redis`);

    const sortedOrders = _.sortBy(orders, (o) => o.createdAt);
    const order = sortedOrders[0];

    try {
      const tokenPair = await tokenPairRepository.getAssetPair(order.tokenPairId);
      if (!tokenPair) continue;

      const currentPrice = await getSafeCurrentPrice(order.tokenPairId);
      if (!currentPrice) continue;

      const limitPrice = order.limitPrice !== null ? Big(order.limitPrice.toString()) : null;

      if (order.expirationTime && new Date(order.expirationTime) < new Date()) {
        await OrderService.updateOrderStatusAndMarketPrice(order.id, OrderStatus.EXPIRED);
        continue;
      }

      const shouldExecute =
        order.orderType === OrderType.Market ||
        (order.orderType === OrderType.Limit &&
          limitPrice !== null &&
          currentPrice.gte(limitPrice));

      if (shouldExecute) {
        const address = await addressRepository.getPrimaryAddressByOrderId(order.id);
        if (!address) {
          console.log(`No address found for order ID: ${order.id}`);
          continue;
        }
        await OrderService.updateOrderStatusAndMarketPrice(order.id, OrderStatus.PROCESSING);

        const { success, txId } = await CommonService.swapTransaction({
          orderType: order.orderType,
          amount: Number(order.amount),
          slippage: Number(order.slippage),
          stopPrice: Number(order.stopPrice),
          limitPrice: Number(order.limitPrice),
          tokenA: tokenPair.assetA,
          tokenB: tokenPair.assetB,
          address: address,
          isMainPair: tokenPair.isMainPair,
        });

        if (success && txId) {
          console.log(`✅ Order ${order.id} txId: ${txId}`);
          await OrderService.updateOrderStatusAndMarketPrice(
            order.id,
            OrderStatus.COMPLETED,
            Number(currentPrice)
          );
          console.log(`✅ Order ${order.id} completed`);

          await redisClient.set(waitingKey, txId);
        } else {
          await OrderService.updateOrderStatusAndMarketPrice(
            order.id,
            OrderStatus.FAILED,
            Number(currentPrice)
          );
          console.warn(`❌ Order ${order.id} failed`);
          await redisClient.set(lockKey, 'false');
        }
      }
    } catch (error) {
      console.error(`Error processing order ${order.id}:`, error);
      await redisClient.set(lockKey, 'false'); // unlock on error
    }
  }
}

// Job to process orders
cron.schedule('*/5 * * * * *', async () => {
  await processPendingOrders();
});
