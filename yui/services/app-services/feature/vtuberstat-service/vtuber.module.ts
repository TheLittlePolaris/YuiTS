import { YuiModule } from '@/ioc-container/decorators'
import { HoloStatRequestService } from './holostat-service/holostat-request.service'
import { YoutubeChannelService } from './channel-service/youtube-channel.service'
import { VtuberStatService } from './vtuberstat.service'

@YuiModule({
  components: [VtuberStatService, HoloStatRequestService, YoutubeChannelService],
})
export class VTuberModule {}
