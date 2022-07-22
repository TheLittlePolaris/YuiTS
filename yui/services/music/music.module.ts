import { YuiModule } from 'djs-ioc-container'
import { MusicService } from './music.service'
import { ConfigModule } from '@/config-service/config.module'
import { YoutubeInfoService } from './youtube-service/youtube-info.service'
import { YoutubeRequestService } from './youtube-service/youtube-request.service'
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service'
import { PolarisSoundCloudService } from './soundcloud-service/soundcloud-info.service'
import { Music } from './constants/decorator.constant'
import { streamsContainer } from './entities/streams-container'

@YuiModule({
  modules: [ConfigModule],
  components: [
    MusicService,
    YoutubeInfoService,
    YoutubeRequestService,
    PolarisSoundCloudPlayer,
    PolarisSoundCloudService
  ],
  providers: [{ provide: Music.StreamProvider, useValue: streamsContainer }]
})
export class MusicModule {}