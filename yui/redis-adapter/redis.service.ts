import { Injectable } from '@tlp01/djs-ioc-container';
import { default as IORedis, Redis } from 'ioredis';

import { ConfigService } from '@/config-service/config.service';
import { YuiLogger } from '@/logger/logger.service';

@Injectable()
export class RedisService {
  private readonly _redisClient: Redis;
  static instance: RedisService;
  constructor(private readonly configService: ConfigService) {
    this._redisClient = new IORedis(configService.redisConfig);
    this._redisClient.on('ready', () => {
      YuiLogger.log('Redis client connected!', RedisService.name);
    });
    RedisService.instance = this;
  }

  get client(): Redis {
    return this._redisClient;
  }

  async set(type: string, key: string, value: string) {
    return this._redisClient.set(this.buildKey(type, key), value);
  }

  async get(type: string, key: string) {
    return this._redisClient.get(this.buildKey(type, key));
  }

  async push(type: string, arrayName: string, value: string) {
    return this._redisClient.rpush(this.buildArrKey(type, arrayName), value);
  }

  async pop(type: string, arrayName: string) {
    return this._redisClient.rpop(this.buildArrKey(type, arrayName));
  }

  buildKey(type: string, key: string) {
    return `${type}/${key}`;
  }
  buildArrKey(type: string, key: string) {
    return `arr_${type}_${key}`;
  }
}
