import { existsSync } from 'fs';

import { RedisOptions } from 'ioredis';
import { config } from 'dotenv';
import { Injectable } from 'djs-ioc-container';

import { YuiLogger } from '@/logger/logger.service';

interface EnvironmentConfig {
  [key: string]: string;
}

@Injectable()
export class ConfigService {
  public envConfig: EnvironmentConfig;
  constructor() {
    const nodeEnvironment = process.env.NODE_ENV;
    if (nodeEnvironment)
      YuiLogger.info(
        `Using ${nodeEnvironment?.toUpperCase() || 'DEVELOPMENT'} environment`,
        this.constructor.name
      );
    else YuiLogger.info('NODE_ENV not detected, using default');

    const filePath = `.env${nodeEnvironment ? `.${nodeEnvironment}` : ``}`;
    const path = existsSync(filePath) ? filePath : '.env';
    const dotEnvironmentConfig = config({ path });
    const { error, parsed } = dotEnvironmentConfig || {};

    if (error) throw new Error(`Fatal: CANNOT READ CONFIG ENVIRONMENT: ${error}`);

    this.envConfig = parsed;
  }

  public get token(): string {
    return this.envConfig.TOKEN;
  }

  public get youtubeApiKey(): string {
    return this.envConfig.YOUTUBE_API_KEY;
  }

  public get tenorKey(): string {
    return this.envConfig.TENOR_KEY;
  }

  public get tenorAnonymousId(): string {
    return this.envConfig.TENOR_ANONYMOUS_ID;
  }

  public get ownerId(): string {
    return this.envConfig.OWNER_ID;
  }

  public get prefix(): string {
    return this.envConfig.PREFIX;
  }

  public get youtubeClientId(): string {
    return this.envConfig.YOUTUBE_CLIENT_ID;
  }

  public get youtubeClientSecret(): string {
    return this.envConfig.YOUTUBE_CLIENT_SECRET;
  }

  public get environment(): 'development' | 'build' {
    return this.envConfig.ENVIRONMENT as 'development' | 'build';
  }

  public get redisConfig(): RedisOptions {
    return {
      host: this.envConfig.REDIS_HOST,
      port: +this.envConfig.REDIS_PORT,
      retryStrategy: (times = 5) => Math.min(times * 1000, 5000)
    };
  }

  public get(key: string) {
    return this.envConfig[key];
  }
}
