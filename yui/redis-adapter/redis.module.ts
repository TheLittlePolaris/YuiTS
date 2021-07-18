import { YuiModule } from '@/ioc-container/decorators'
import { RedisService } from './redis.service'

@YuiModule({ components: [RedisService] })
export class RedisModule {}
