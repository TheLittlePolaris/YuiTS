import { Module } from '@tlp01/djs-ioc-container';

import { OwnerChannelService } from './statistics.service';

@Module({
  components: [OwnerChannelService]
})
export class OwnerServiceModule {}
