import cron from 'node-cron';
import Big from 'big.js';
import { PrismaClient, Prisma } from '@prisma/client';
import { blockfrostAPI } from '../../infrastructure/blockfrost/blockfrost-api';
import { PrismaTokenPairRepository } from '../../persistence/repositories/token-pair-repository';
import { PrismaTokenRepository } from '../../persistence/repositories/token-repository';
import { CommonService } from '../services/common/service';

// Khởi tạo Prisma client
const prisma = new PrismaClient();

// Khởi tạo repositories
const tokenRepository = new PrismaTokenRepository();
const tokenPairRepository = new PrismaTokenPairRepository();

// Hàm cập nhật decimals cho token
async function updateTokenDecimals() {
  try {
    // Lấy tối đa 10 token chưa có decimals
    const tokens = await tokenRepository.findByField('decimals', null);

    for (const token of tokens.slice(0, 10)) {
      try {
        const assetId = token.policyId + token.tokenHexName;
        const assetInfo = await blockfrostAPI.assetsById(assetId);
        const decimals =
          (assetInfo.metadata?.decimals as number | undefined) ??
          (assetInfo.onchain_metadata?.decimals as number | undefined) ??
          0;

        await tokenRepository.update(token.id, { decimals });
      } catch (error) {
        console.error(`Lỗi khi lấy decimals cho token ${token.id}:`, error);
      }

      // Delay 100ms để tránh vượt giới hạn 10 requests/s
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật decimals:', error);
  }
}

// Hàm lấy và lưu giá cặp token
async function fetchAndStorePrices() {
  try {
    // Lấy 10 cặp token có isEnablePriceHistory = true
    const tokenPairs = await tokenPairRepository.findByField('isEnablePriceHistory', true);

    const pricePromises = tokenPairs.slice(0, 10).map(async (pair) => {
      try {
        // Lấy thông tin asset pair
        const assetPair = await tokenPairRepository.getAssetPair(pair.id);

        // Lấy giá từ CommonService
        const price = await CommonService.getTokenPairPrice(assetPair);

        // Lấy thông tin decimals từ tokenA và tokenB
        const tokenA = await tokenRepository.get(pair.tokenAId);
        const tokenB = await tokenRepository.get(pair.tokenBId);

        if (!tokenA || !tokenB || tokenA.decimals === null || tokenB.decimals === null) {
          console.warn(`Thiếu thông tin decimals cho cặp ${pair.id}`);
          return null;
        }

        // Điều chỉnh giá dựa trên decimals
        const adjustedPrice = new Big(price).div(
          new Big(10).pow(tokenB.decimals - tokenA.decimals)
        );

        return {
          tokenPairId: pair.id,
          price: new Prisma.Decimal(adjustedPrice.toString()),
          timestamp: new Date(),
        };
      } catch (error) {
        console.error(`Lỗi khi lấy giá cho cặp ${pair.id}:`, error);
        return null;
      }
    });

    const prices = (await Promise.all(pricePromises)).filter((p) => p !== null);

    // Lưu vào TokenPairHistoryPrice bằng Prisma client
    if (prices.length > 0) {
      await prisma.tokenPairHistoryPrice.createMany({
        data: prices.map((price) => ({
          tokenPairId: price!.tokenPairId,
          price: price!.price,
          timestamp: price!.timestamp,
        })),
      });
      console.log(`Đã lưu ${prices.length} giá vào TokenPairHistoryPrice`);
    }
  } catch (error) {
    console.error('Lỗi khi lấy và lưu giá:', error);
  }
}

// Khởi tạo cron-job chạy mỗi phút
const priceJob = cron.schedule(
  '*/1 * * * *',
  async () => {
    console.log('🚀 ~ cron.schedule lấy giá - ', new Date());
    await updateTokenDecimals(); // Cập nhật decimals trước
    await fetchAndStorePrices(); // Lấy và lưu giá
  },
  { timezone: 'UTC' }
);

// Hàm khởi động
export function startPriceFetcher() {
  priceJob.start();
  console.log('Cron-job lấy giá đã khởi động');
}

// Đóng Prisma client khi ứng dụng tắt
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
