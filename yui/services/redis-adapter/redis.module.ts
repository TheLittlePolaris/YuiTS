import { YuiModule } from '@/ioc-container'
import { RedisService } from './redis.service'

@YuiModule({ components: [RedisService] })
export class RedisModule {}
