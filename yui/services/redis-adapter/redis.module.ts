import { ConfigModule } from '@/config-service/config.module'
import { YuiModule } from '@/ioc-container/decorators'
import { RedisService } from './redis.service'

@YuiModule({ modules: [ConfigModule], components: [RedisService] })
export class RedisModule {}
