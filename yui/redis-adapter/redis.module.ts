import { YuiModule } from '@/dep-injection-ioc/decorators'
import { RedisService } from './redis.service'

@YuiModule({ components: [RedisService] })
export class RedisModule {}
