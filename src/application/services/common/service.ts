import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
  BlockfrostAdapter,
  calculateAmountWithSlippageTolerance,
  DexV2,
  getBackendBlockfrostLucidInstance,
  GetV2PoolPriceParams,
  NetworkId,
  OrderV2,
  PoolV2,
} from '@minswap/sdk';
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_PROJECT_ID,
  CARDANO_NETWORK,
  PRIVATE_KEY,
  SOURCE_ADDRESS,
} from '../../helpers/constants';
import { AssetPair } from '../../types/asset-pair';
import { OrderParamsV2 } from '../../types/order-params';
import { CommonServiceInterface } from './interface';
import Big from 'big.js';
import { OrderType } from '../../types/enums';
import { CalculateAmountOutOptions } from '../../types/caculate';

class CommonServiceClass implements CommonServiceInterface {
  private blockFrostApi: BlockFrostAPI;

  constructor() {
    this.blockFrostApi = new BlockFrostAPI({
      projectId: BLOCKFROST_PROJECT_ID,
      network: CARDANO_NETWORK,
    });
  }

  async getTokenPairPrice(assetPair: AssetPair): Promise<Big> {
    const blockfrostAdapter = new BlockfrostAdapter(NetworkId.TESTNET, this.blockFrostApi);
    const pool = await blockfrostAdapter.getV2PoolByPair(assetPair.assetA, assetPair.assetB);

    if (!pool) {
      throw new Error('Could not find pool for the given asset pair.');
    }

    const [priceAB, priceBA] = await this.getV2PoolPrice({ pool });

    if (assetPair.isMainPair) {
      return priceAB;
    }

    return priceBA;
  }

  async swapTransaction(orderParams: OrderParamsV2): Promise<{ success: boolean; txId?: string }> {
    try {
      const blockfrostAdapter = new BlockfrostAdapter(NetworkId.TESTNET, this.blockFrostApi);

      const lucid = await getBackendBlockfrostLucidInstance(
        NetworkId.TESTNET,
        BLOCKFROST_PROJECT_ID,
        BLOCKFROST_API_URL,
        SOURCE_ADDRESS
      );

      const pool = await blockfrostAdapter.getV2PoolByPair(orderParams.tokenA, orderParams.tokenB);
      if (!pool) {
        throw new Error('Could not find pool for the given asset pair.');
      }

      const unit = orderParams.tokenA.policyId + orderParams.tokenA.tokenName;
      const swapInDecimal = await this.getAssetDecimals(unit);
      const swapAmountBig = Big(orderParams.amount).mul(Big(10).pow(swapInDecimal));
      const swapAmount = BigInt(swapAmountBig.toString());

      const amountOut = this.calculateAmountOut({
        reserveIn: orderParams.isMainPair ? pool.reserveA : pool.reserveB,
        reserveOut: orderParams.isMainPair ? pool.reserveB : pool.reserveA,
        amountIn: swapAmount,
        tradingFeeNumerator: pool.feeA[0],
      });

      const acceptedAmountOut = calculateAmountWithSlippageTolerance({
        slippageTolerancePercent: orderParams.slippage,
        amount: amountOut,
        type: 'down',
      });

      console.log('📝 Building transaction with details:');
      console.log(`- Address: ${orderParams.address}`);
      console.log(`- TokenA: ${unit}`);
      console.log(`- Amount In: ${swapAmount.toString()}`);
      console.log(`- Min Amount Out (with slippage): ${acceptedAmountOut.toString()}`);
      console.log(`- Is Limit Order: ${orderParams.orderType === OrderType.Limit}`);

      const txComplete = await new DexV2(lucid, blockfrostAdapter).createBulkOrdersTx({
        sender: orderParams.address,
        orderOptions: [
          {
            type: OrderV2.StepType.SWAP_EXACT_IN,
            amountIn: swapAmount,
            assetIn: orderParams.tokenA,
            direction: orderParams.isMainPair ? OrderV2.Direction.A_TO_B : OrderV2.Direction.B_TO_A,
            minimumAmountOut: acceptedAmountOut,
            lpAsset: pool.lpAsset,
            isLimitOrder: orderParams.orderType === OrderType.Limit,
            killOnFailed: false,
          },
        ],
      });

      lucid.selectWalletFromSeed(PRIVATE_KEY);
      const signedTx = await txComplete.sign().commit();
      const txId = await signedTx.submit();

      console.log(`🚀 Tx submitted: ${txId}`);
      return { success: true, txId };
    } catch (error: any) {
      console.error('❌ Error in swapTransaction:', error);

      if (error.message && error.message.includes('BadInputsUTxO')) {
        console.warn('⚠ Detected BadInputsUTxO. Likely stale or already-used UTxO.');
        return { success: false };
      }

      // General fail-safe
      return { success: false };
    }
  }

  //#region private methods
  private async getV2PoolPrice({
    pool,
    decimalsA,
    decimalsB,
  }: GetV2PoolPriceParams): Promise<[Big, Big]> {
    if (decimalsA === undefined) {
      decimalsA = await this.getAssetDecimals(pool.assetA);
    }
    if (decimalsB === undefined) {
      decimalsB = await this.getAssetDecimals(pool.assetB);
    }
    const adjustedReserveA = Big(pool.reserveA.toString()).div(Big(10).pow(decimalsA));
    const adjustedReserveB = Big(pool.reserveB.toString()).div(Big(10).pow(decimalsB));

    const priceAB = adjustedReserveB.div(adjustedReserveA);
    const priceBA = adjustedReserveA.div(adjustedReserveB);
    return [priceAB, priceBA];
  }

  private async getAssetDecimals(asset: string): Promise<number> {
    if (asset === 'lovelace' || asset === '') {
      return 6;
    }
    try {
      const assetAInfo = await this.blockFrostApi.assetsById(asset);
      const decimals =
        (assetAInfo.metadata?.decimals as number | undefined) ??
        (assetAInfo.onchain_metadata?.decimals as number | undefined) ??
        0;
      return decimals;
    } catch (err) {
      if (err instanceof BlockfrostServerError && err.status_code === 404) {
        return 0;
      }
      throw err;
    }
  }

  private calculateAmountOut({
    reserveIn, 
    reserveOut, 
    amountIn, 
    tradingFeeNumerator,
  }: CalculateAmountOutOptions): bigint {
    const diff = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator;
    const inWithFee = diff * amountIn;
    const numerator = inWithFee * reserveOut;

    const denominator = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR * reserveIn + inWithFee;

    return numerator / denominator;
  }
  //#endregion
}

export const CommonService = new CommonServiceClass();
