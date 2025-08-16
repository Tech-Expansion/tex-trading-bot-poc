import RedisClient from '../../../infrastructure/redis/redis';
import { REDIS_KEY, REDIS_TTL_SECONDS } from '../../helpers/constants';

class SessionManager {
  private static instance: SessionManager | null = null;
  private redisClient: RedisClient;

  private constructor() {
    this.redisClient = RedisClient.getInstance();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async setKey(
    sessionId: string,
    key: string,
    redisKey: REDIS_KEY,
    ttlSeconds: number = REDIS_TTL_SECONDS, 
  ): Promise<void> {
    const now = Date.now();
    const sessionData = {
      key,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
    };

    await this.redisClient.set(`session:${sessionId}:${redisKey}`, JSON.stringify(sessionData), ttlSeconds);
  }

  public async getKey(sessionId: string, redisKey: REDIS_KEY): Promise<string | null> {
    const sessionData = await this.redisClient.get(`session:${sessionId}:${redisKey}`);
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    if (Date.now() > session.expiresAt) {
      await this.removeSession(sessionId);
      return null;
    }

    return session.key;
  }

  public async removeSession(sessionId: string): Promise<void> {
    await this.redisClient.del(`session:${sessionId}`);
  }

  public async hasSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.redisClient.get(`session:${sessionId}`);
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    if (Date.now() > session.expiresAt) {
      await this.removeSession(sessionId);
      return false;
    }
    return true;
  }
}

export default SessionManager;
