import cron from 'node-cron';
import { checkTxConfirm } from '../../infrastructure/blockfrost/blockfrost-api';
import RedisClient from '../../infrastructure/redis/redis';

const redisClient = RedisClient.getInstance();

async function pollPendingTxs() {
  const keys = await redisClient.keys('wallet:*:waiting_for_confirm');

  if (keys.length === 0) {
    console.log('✅ No pending tx to check.');
    return;
  }

  for (const key of keys) {
    const walletId = key.split(':')[1];
    const txId = await redisClient.get(key);

    if (!txId) {
      console.warn(`⚠ Missing txId in Redis for ${key}`);
      continue;
    }

    try {
      const isConfirmed = await checkTxConfirm(txId);

      if (isConfirmed) {
        console.log(`✅ Tx ${txId} confirmed for wallet ${walletId}`);
        await redisClient.del(key);
        await redisClient.set(`wallet:${walletId}:locked`, 'false');
      } else {
        console.log(`⏳ Tx ${txId} still pending for wallet ${walletId}`);
      }
    } catch (error) {
      console.error(`❌ Error checking tx ${txId} for wallet ${walletId}:`, error);
    }
  }
}

// Schedule polling job every 15 seconds
cron.schedule('*/15 * * * * *', async () => {
  console.log('⏰ Checking pending tx confirmations...');
  await pollPendingTxs();
});
