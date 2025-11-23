import { configDotenv } from 'dotenv';
import { Logger } from 'pino';
import { logger } from '../../domain/extensions/logger';
import { CardanoNetwork } from '@blockfrost/blockfrost-js/lib/types';

configDotenv();

const retrieveEnvVariable = (variableName: string, logger: Logger) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    logger.error(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

// Wallet
export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY', logger);
export const STAKE_ID = retrieveEnvVariable('STAKE_ID', logger);
export const SOURCE_ADDRESS = retrieveEnvVariable('SOURCE_ADDRESS', logger);
export const TARGET_ADDRESS = retrieveEnvVariable('TARGET_ADDRESS', logger);

// Blockfrost
export const BLOCKFROST_PROJECT_ID = retrieveEnvVariable('BLOCKFROST_PROJECT_ID', logger);
export const BLOCKFROST_API_URL = retrieveEnvVariable('BLOCKFROST_API_URL', logger);
export const COINGECKO_API_KEY = retrieveEnvVariable('COINGECKO_API_KEY', logger);

// Settings
export const CARDANO_NETWORK = retrieveEnvVariable('CARDANO_NETWORK', logger) as CardanoNetwork;
export const BLOCKFROST_REQUEST_CONCURRENCY = parseInt(
  retrieveEnvVariable('BLOCKFROST_REQUEST_CONCURRENCY', logger),
  10
);
export const FIAT_RATES_REQUESTS_PER_SEC = parseInt(
  retrieveEnvVariable('FIAT_RATES_REQUESTS_PER_SEC', logger),
  10
);

// Tokens
export const DEFAULT_COMPARED_TIME = 60; // in minutes
export const UNKNOWN_TOKEN = 'unknown';

export const ADA = {
  policyId: '',
  tokenName: '',
};

export const MIN = {
  policyId: retrieveEnvVariable('MIN_POLICY_ID', logger),
  tokenName: retrieveEnvVariable('MIN_TOKEN_NAME', logger),
};

// Bot
export const BOT_TOKEN = retrieveEnvVariable('BOT_TOKEN', logger);

// REDIS
export const REDIS_TTL_SECONDS = 3600;
export enum REDIS_KEY {
  PRIVATE_KEY = "privateKey", 
  TELEGRAM_ID = "telegramId",
  STAKE_ID = "stakeId", 
}

export enum REDIS_TTL {
  OneDay = 86400
}