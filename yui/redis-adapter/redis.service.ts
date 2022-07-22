import { ConfigService } from '@/config-service/config.service'
import { Injectable } from 'djs-ioc-container'
import { YuiLogger } from '@/logger/logger.service'
import { default as IORedis, Redis } from 'ioredis'

@Injectable()
export class RedisService {
  private _redisClient: Redis
  static instance: RedisService
  constructor(private readonly configService: ConfigService) {
    this._redisClient = new IORedis(configService.redisConfig)
    this._redisClient.on('ready', () => {
      YuiLogger.log(`Redis client connected!`, RedisService.name)
    })
    RedisService.instance = this
  }

  get client(): Redis {
    return this._redisClient
  }

  set(type: string, key: string, value: string) {
    return this._redisClient.set(this.buildKey(type, key), value)
  }

  get(type: string, key: string) {
    return this._redisClient.get(this.buildKey(type, key))
  }

  push(type: string, arrayName: string, value: string) {
    return this._redisClient.rpush(this.buildArrKey(type, arrayName), value)
  }

  pop(type: string, arrayName: string) {
    return this._redisClient.rpop(this.buildArrKey(type, arrayName))
  }

  buildKey(type: string, key: string) {
    return `${type}/${key}`
  }
  buildArrKey(type: string, key: string) {
    return `arr_${type}_${key}`
  }
}
