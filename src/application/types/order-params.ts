import { Asset } from "@minswap/sdk";
import { OrderType } from "./enums";

export interface OrderParamsV2 {
  orderType: OrderType;
  amount: number;
  slippage: number;
  stopPrice?: number | null;
  limitPrice?: number | null;
  tokenA: Asset;
  tokenB: Asset;
  address: string;
  isMainPair?: boolean;
}
