import { Module } from '@tlp01/djs-ioc-container';

import { ConfigService } from './config.service';

@Module({
  components: [ConfigService]
})
export class ConfigModule {}
