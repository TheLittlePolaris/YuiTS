import { YuiModule } from '@/ioc-container/decorators'
import { OwnerChannelService } from './channel.service'

@YuiModule({
  components: [OwnerChannelService]
})
export class OwnerServiceModule {}
