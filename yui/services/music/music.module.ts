import { YuiModule } from '@tlp01/djs-ioc-container';

import { MusicService } from './music.service';
import { YoutubeInfoService } from './youtube-service/youtube-info.service';
import { YoutubeRequestService } from './youtube-service/youtube-request.service';
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service';
import { PolarisSoundCloudService } from './soundcloud-service/soundcloud-info.service';
import { Music } from './constants/decorator.constant';
import { streamsContainer } from './entities/streams-container';

import { ConfigModule } from '@/config-service/config.module';

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
