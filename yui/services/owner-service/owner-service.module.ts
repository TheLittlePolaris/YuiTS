import { YuiModule } from '@/dep-injection-ioc/decorators'
import { OwnerChannelService } from './channel.service'

@YuiModule({
  components: [OwnerChannelService],
})
export class OwnerServiceModule {}
