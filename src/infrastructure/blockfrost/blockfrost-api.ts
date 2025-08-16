import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import { BLOCKFROST_PROJECT_ID, CARDANO_NETWORK } from '../../application/helpers/constants';
import { Options } from '@blockfrost/blockfrost-js/lib/types';
import { AffectedAddressesInBlock, BlockContent } from '../../application/types/event';
import { logger } from '../../domain/extensions/logger';
import { BlockfrostAdapter, NetworkId } from '@minswap/sdk';
import { limiter } from '../../application/utils/limiter';

//hardcoded
export const getBlockfrostClient = (options?: Partial<Options>) => {
    return new BlockFrostAPI({
        projectId: BLOCKFROST_PROJECT_ID,
        network: CARDANO_NETWORK,
        ...options,
    });
};

//hardcoded
const getBlockfrostAdapter = () => {
    const blockFrostApi = new BlockFrostAPI({
        projectId: BLOCKFROST_PROJECT_ID,
        network: CARDANO_NETWORK,
    });

    return new BlockfrostAdapter(NetworkId.TESTNET, blockFrostApi);
};


export const getBlockData = async (options?: {
    block?: number | string;
    attempt?: number;
}): Promise<{
    latestBlock: BlockContent;
    affectedAddresses: AffectedAddressesInBlock;
}> => {
    // Fetch latest block and all addresses affected in the block
    // Fetching of affected addresses may fail, there are 3 retry attempts before throwing an error
    const MAX_ATTEMPTS = 3;
    const latestBlock = await limiter(() =>
        options?.block ? blockfrostAPI.blocks(options.block) : blockfrostAPI.blocksLatest()
    );
    let affectedAddresses: AffectedAddressesInBlock = [];

    try {
        affectedAddresses = await limiter(() =>
            blockfrostAPI.blocksAddressesAll(latestBlock.hash, { batchSize: 2 })
        );
    } catch (error) {
        if (
            error instanceof BlockfrostServerError &&
            error.status_code === 404 // Backend lagging, block rollback
        ) {
            const attempt = options?.attempt ?? 0;

            if (attempt < MAX_ATTEMPTS - 1) {
                logger.warn(
                    `Unable to fetch addresses for block ${latestBlock.height} ${latestBlock.hash}. Block no longer on chain.`
                );
                return getBlockData({ ...options, attempt: attempt + 1 });
            } else {
                throw error;
            }
        } else {
            throw error;
        }
    }

    return {
        latestBlock,
        affectedAddresses,
    };
};

export const blockfrostAPI = getBlockfrostClient();

export const blockfrostAdapter = getBlockfrostAdapter();

export const getAddressesByStakeAddress = async (stakeAddress: string): Promise<string[]> => {
    try {
        const addresses = await limiter(() =>
            blockfrostAPI.accountsAddressesAll(stakeAddress, { batchSize: 20 })
        );

        return addresses.map((item) => item.address);
    } catch (error) {
        logger.error(`❌ Failed to fetch addresses for stake address ${stakeAddress}: ${error}`);
        throw error;
    }
};

export async function checkTxConfirm(txId: string): Promise<boolean> {
    try {
      const txInfo = await blockfrostAPI.txs(txId);
      if (!txInfo.block_height) {
        console.log(`⏳ Tx ${txId} still pending.`);
        return false;
      }
      return true;
    } catch (error: any) {
      if (error.status_code === 404) {
        console.log(`⏳ Tx ${txId} not yet indexed (404), treat as pending.`);
        return false;
      }
      console.error(`❌ Blockfrost check error for txId ${txId}:`, error);
      return false;
    }
}