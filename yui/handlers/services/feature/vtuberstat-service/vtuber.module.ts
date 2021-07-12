import { YuiModule } from '@/dep-injection-ioc/decorators'
import { HoloStatRequestService } from './holostat-service/holostat-request.service'

import { BilibiliChannelService } from './channel-service/bilibili-channel.service'
import { YoutubeChannelService } from './channel-service/youtube-channel.service'
import { VtuberStatService } from './vtuberstat.service'

@YuiModule({
  components: [
    VtuberStatService,
    HoloStatRequestService,

    BilibiliChannelService,
    YoutubeChannelService,
  ]
})
export class VTuberModule {}
