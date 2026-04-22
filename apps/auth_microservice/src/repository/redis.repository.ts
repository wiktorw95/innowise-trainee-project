import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || `6379`, 10),
});

redis.on('connect', () => {
  console.log('Redis: Connection established successfully');
});

redis.on('error', (err) => {
  console.error('Redis: Connection error:', err);
});

export interface SessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RedisRepository {
  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await redis.get(`blacklist:access:${jti}`);
    return result !== null;
  }

  async isRefreshTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await redis.get(`blacklist:refresh:${jti}`);
    return result !== null;
  }

  async blacklistAccessToken(jti: string, TTL: number): Promise<void> {
    await redis.set(`blacklist:access:${jti}`, 'true', 'EX', TTL);
  }

  async blacklistRefreshToken(jti: string, TTL: number): Promise<void> {
    await redis.set(`blacklist:refresh:${jti}`, 'true', 'EX', TTL);
  }

  async storeSession(
    refreshTokenId: string,
    sessionData: SessionData,
    ttlInSeconds = 7 * 24 * 60 * 60
  ): Promise<void> {
    await redis.set(
      `refresh_tokens:${refreshTokenId}`,
      JSON.stringify(sessionData),
      'EX',
      ttlInSeconds
    );
  }

  async findSessionByTokenId(
    refreshTokenId: string
  ): Promise<SessionData | null> {
    const data = await redis.get(`refresh_tokens:${refreshTokenId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(refreshTokenId: string): Promise<void> {
    await redis.del(`refresh_tokens:${refreshTokenId}`);
  }
}
