import { YuiModule } from '@/decorators/dep-injection-ioc/decorators'
import { HoloStatRequestService } from './holostat-service/holostat-request.service'
import { NijiStatRequestService } from './nijistat-service/nijistat-request.service'
import { BilibiliChannelService } from './channel-service/bilibili-channel.service'
import { YoutubeChannelService } from './channel-service/youtube-channel.service'
import { VtuberStatService } from './vtuberstat.service'
import { INJECT_TOKEN } from '@/constants/constants'

@YuiModule({
  components: [
    VtuberStatService,
    HoloStatRequestService,
    NijiStatRequestService,
    BilibiliChannelService,
    YoutubeChannelService,
  ],
  providers: [{ provide: INJECT_TOKEN.YOUTUBE_API_KEY, useValue: global.config.youtubeApiKey }],
})
export class VTuberModule {}
