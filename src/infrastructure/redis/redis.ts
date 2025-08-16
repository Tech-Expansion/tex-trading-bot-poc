import { createClient, RedisClientType } from 'redis';

interface RedisConfig {
  url: string;
}

class RedisClient {
  private static instance: RedisClient | null = null;
  private client: RedisClientType;
  private isConnected: boolean;

  private constructor(config: RedisConfig) {
    if (!config.url) {
      throw new Error('Redis URL is not provided. Please set the REDIS_URL environment variable.');
    }

    this.client = createClient({
      url: config.url,
    });

    this.isConnected = false;

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      console.log('Disconnected from Redis');
      this.isConnected = false;
    });

    this.connect();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error(
          'Redis URL is not provided. Please set the REDIS_URL environment variable.'
        );
      }

      RedisClient.instance = new RedisClient({
        url: redisUrl,
      });
    }
    return RedisClient.instance;
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
    await this.client.set(key, value, options);
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export default RedisClient;
