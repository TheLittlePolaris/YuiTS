import { YuiModule } from 'djs-ioc-container'
import { OwnerChannelService } from './statistics.service'

@YuiModule({
  components: [OwnerChannelService]
})
export class OwnerServiceModule {}
