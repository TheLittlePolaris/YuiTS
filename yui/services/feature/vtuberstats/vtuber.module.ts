import { Module } from '@tlp01/djs-ioc-container';

import { HoloStatRequestService } from './requests/holostat-request.service';
import { YoutubeChannelService } from './requests/youtube-channel.service';
import { VtuberStatService } from './vtuberstat.service';

@Module({
  components: [VtuberStatService, HoloStatRequestService, YoutubeChannelService]
})
export class VTuberModule {}
