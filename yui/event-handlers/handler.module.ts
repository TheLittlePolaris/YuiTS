import { Module } from '@tlp01/djs-ioc-container';

import {
  MessageCreateEventHandler,
  DMEventHandler,
  MessageCreateInterceptor,
  DMInterceptor
} from './messageCreate';
import { ReadyEventHandler } from './ready';
import { VoiceStateEventHandler, VoiceStateInterceptor } from './voiceStateUpdate';

import { AdminModule } from '@/services/administration/admin.module';
import { FeatureModule } from '@/services/feature/feature.module';
import { MusicModule } from '@/services/music/music.module';
import { OwnerServiceModule } from '@/services/statistics/statistics.module';

@Module({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [
    MessageCreateEventHandler,
    VoiceStateEventHandler,
    DMEventHandler,
    ReadyEventHandler
  ],
  interceptors: [MessageCreateInterceptor, DMInterceptor, VoiceStateInterceptor]
})
export class HandlerModule {}
