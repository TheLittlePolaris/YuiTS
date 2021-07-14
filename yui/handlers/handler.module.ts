import { VoiceStateHandler } from './voice-state.handler'
import { MessageHandler } from './message.handler'
import { YuiModule } from '@/dep-injection-ioc/decorators'
import { MusicModule } from '../services/app-services/music/music.module'
import { FeatureModule } from '../services/app-services/feature/feature.module'
import { AdminModule } from '../services/app-services/administration/admin.module'
import { OwnerServiceModule } from '../services/owner-service/owner-service.module'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [MessageHandler, VoiceStateHandler],
})
export class HandlerModule {}
