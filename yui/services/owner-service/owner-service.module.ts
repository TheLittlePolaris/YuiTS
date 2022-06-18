import { YuiModule } from '@/ioc-container'
import { OwnerChannelService } from './channel.service'

@YuiModule({
  components: [OwnerChannelService]
})
export class OwnerServiceModule {}
