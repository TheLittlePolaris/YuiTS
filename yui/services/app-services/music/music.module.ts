import { MusicService } from './music.service'
import { YuiModule } from '@/ioc-container/decorators'
import { ConfigModule } from '@/config-service/config.module'
import { GlobalMusicStream } from '@/custom-classes/global-music-streams'
import { YoutubeInfoService } from './youtube-service/youtube-info.service'
import { YoutubeRequestService } from './youtube-service/youtube-request.service'
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service'
import { PolarisSoundCloudService } from './soundcloud-service/soundcloud-info.service'

@YuiModule({
  modules: [ConfigModule],
  components: [
    MusicService,
    YoutubeInfoService,
    YoutubeRequestService,
    PolarisSoundCloudPlayer,
    PolarisSoundCloudService,
    GlobalMusicStream,
  ],
})
export class MusicModule {}
