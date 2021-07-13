import { ConfigService } from '@/config-service/config.service'
import { Injectable } from '@/dep-injection-ioc/decorators'
import { YuiLogger } from '@/log/logger.service'
import { default as IORedis, Redis } from 'ioredis'

@Injectable()
export class RedisService {
  private _redisClient: Redis
  constructor(private readonly configService: ConfigService) {
    this._redisClient = new IORedis(configService.redisConfig)
    this._redisClient.on('ready', () => {
      YuiLogger.log(`Redis client connected!`, RedisService.name)
    })
  }

  public get client(): Redis {
    return this._redisClient
  }

  public set(type: string, key: string, value: string) {
    return this._redisClient.set(this.buildKey(type, key), value)
  }

  public get(type: string, key: string) {
    return this._redisClient.get(this.buildKey(type, key))
  }

  public push(type: string, arrayName: string, value: string) {
    return this._redisClient.rpush(this.buildArrKey(type, arrayName), value)
  }

  public pop(type: string, arrayName: string, value: string) {
    return this._redisClient.rpop(this.buildArrKey(type, arrayName))
  }

  public buildKey(type: string, key: string) {
    return `${type}/${key}`
  }
  public buildArrKey(type: string, key: string) {
    return `arr_${type}_${key}`
  }
}
