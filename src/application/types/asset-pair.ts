import { Asset } from "@minswap/sdk";

export interface AssetPair {
    assetA: Asset;
    assetB: Asset;
    isMainPair?: boolean;
}

export interface AssetPairDto extends AssetPair {
    tokenPairName?: string | null;
}