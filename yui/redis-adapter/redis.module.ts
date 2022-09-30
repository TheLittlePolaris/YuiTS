import { YuiModule } from 'djs-ioc-container';

import { RedisService } from './redis.service';

@YuiModule({ components: [RedisService] })
export class RedisModule {}
