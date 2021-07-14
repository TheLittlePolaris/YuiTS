import { VoiceStateHandler } from './voice-state.handler'
import { MessageHandler } from './message.handler'
import { YuiModule } from '@/dep-injection-ioc/decorators'
import { MusicModule } from './services/music/music.module'
import { FeatureModule } from './services/feature/feature.module'
import { AdminModule } from './services/administration/admin.module'
import { OwnerServiceModule } from './owner-service/owner-service.module'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [MessageHandler, VoiceStateHandler],
})
export class HandlerModule {}
