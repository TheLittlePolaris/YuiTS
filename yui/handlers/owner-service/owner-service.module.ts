import { YuiModule } from '@/decorators/dep-injection-ioc/decorators'
import { OwnerChannelService } from './channel.service'

@YuiModule({
  components: [OwnerChannelService],
})
export class OwnerServiceModule {}
