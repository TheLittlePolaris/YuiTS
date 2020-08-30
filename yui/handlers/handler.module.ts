import { VoiceStateHandler } from './voice-state.handler'
import { MessageHandler } from './message.handler'
import { YuiModule } from '@/decorators/dep-injection-ioc/decorators'
import { MusicModule } from './services/music/music.module'
import { FeatureModule } from './services/feature/feature.module'
import { AdminModule } from './services/administration/admin.module'

@YuiModule({
  providers: [],
  modules: [MusicModule, FeatureModule, AdminModule],
  components: [MessageHandler, VoiceStateHandler],
})
export class HandlerModule {}
