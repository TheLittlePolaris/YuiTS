import { YuiModule } from '@/decorators/dep-injection-ioc/decorators'
import { MusicService } from './music.service'
import { GlobalMusicStream } from './global-streams'
import { YoutubeInfoService } from './youtube-service/youtube-info.service'
import { YoutubeRequestService } from './youtube-service/youtube-request.service'
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service'
import { PolarisSoundCloudService } from './soundcloud-service/soundcloud-info.service'
import { INJECT_TOKEN } from '@/decorators/dep-injection-ioc/constants/di-connstants'

@YuiModule({
  providers: [
    { provide: INJECT_TOKEN.GLOBAL_STREAMS, useValue: GlobalMusicStream._streams },
    { provide: INJECT_TOKEN.YOUTUBE_API_KEY, useValue: global.config.youtubeApiKey },
  ],
  components: [
    MusicService,
    YoutubeInfoService,
    YoutubeRequestService,
    PolarisSoundCloudPlayer,
    PolarisSoundCloudService,
  ],
})
export class MusicModule {}
