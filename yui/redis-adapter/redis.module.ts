import { Module } from '@tlp01/djs-ioc-container';

import { RedisService } from './redis.service';

@Module({ components: [RedisService] })
export class RedisModule {}
