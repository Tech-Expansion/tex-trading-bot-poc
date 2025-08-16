import PQueue, { QueueAddOptions } from 'p-queue';
import { BLOCKFROST_REQUEST_CONCURRENCY, FIAT_RATES_REQUESTS_PER_SEC } from '../helpers/constants';
import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import { logger } from '../../domain/extensions/logger';

const pLimiter = new PQueue({
  concurrency: BLOCKFROST_REQUEST_CONCURRENCY,
});

const pratesLimiter = new PQueue({
  intervalCap: FIAT_RATES_REQUESTS_PER_SEC,
  interval: 1000,
  carryoverConcurrencyCount: true,
});

const handleError = (error: any) => {
  if (error instanceof BlockfrostServerError && error.status_code === 404) {
    // do not log 404 errors
  } else {
    logger.error(`pLimiter error`, error);
  }
};

const handleRatesLimiterError = (error: any) => {
  logger.warn(`ratesLimiter error`, error);
};

export const limiter = <T>(
  task: () => PromiseLike<T>,
  options?: Exclude<QueueAddOptions, 'throwOnTimeout'>
) =>
  pLimiter.add<T>(
    async () => {
      try {
        return await task();
      } catch (error) {
        handleError(error);
        throw error; // rethrow the error after logging it
      }
    },
    { ...options, throwOnTimeout: true }
  );

export const ratesLimiter = <T>(
  task: () => PromiseLike<T>,
  options?: Exclude<QueueAddOptions, 'throwOnTimeout'>
) =>
  pratesLimiter.add<T>(
    async () => {
      try {
        return await task();
      } catch (error) {
        handleRatesLimiterError(error);
        throw error; // rethrow the error after logging it
      }
    },
    { ...options, throwOnTimeout: true }
  );
