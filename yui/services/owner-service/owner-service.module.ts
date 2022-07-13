import { YuiModule } from 'djs-ioc-container'
import { OwnerChannelService } from './channel.service'

@YuiModule({
  components: [OwnerChannelService]
})
export class OwnerServiceModule {}
