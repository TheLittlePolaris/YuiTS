import { HoloStatRequestService } from './holostat-service/holostat-request.service'
import { YoutubeChannelService } from './channel-service/youtube-channel.service'
import { VtuberStatService } from './vtuberstat.service'
import { YuiModule } from '@/ioc-container/decorators'

@YuiModule({
  components: [VtuberStatService, HoloStatRequestService, YoutubeChannelService],
})
export class VTuberModule {}
