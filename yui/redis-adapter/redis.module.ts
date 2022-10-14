import { YuiModule } from '@tlp01/djs-ioc-container';

import { RedisService } from './redis.service';

@YuiModule({ components: [RedisService] })
export class RedisModule {}
