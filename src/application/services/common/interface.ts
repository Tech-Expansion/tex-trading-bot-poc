import Big from 'big.js';
import { AssetPair } from '../../types/asset-pair';
import { OrderParamsV2 } from '../../types/order-params';

export interface CommonServiceInterface {
  getTokenPairPrice(assetPair: AssetPair): Promise<Big>;
  swapTransaction(orderParams: OrderParamsV2): Promise<{ success: boolean; txId?: string }>;
}
