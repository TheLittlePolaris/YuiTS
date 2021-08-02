import { VoiceStateHandler } from './voice-state.handler'
import { TextMessageHandler } from './message.handler'
import { MusicModule } from '../services/app-services/music/music.module'
import { FeatureModule } from '../services/app-services/feature/feature.module'
import { AdminModule } from '../services/app-services/administration/admin.module'
import { OwnerServiceModule } from '../services/owner-service/owner-service.module'
import { DMHandler } from './dm.handler'
import { YuiModule } from '@/ioc-container/decorators'
import { ReadyHandler } from './ready.handler'
import { DMInterceptor, TextMessageInterceptor } from './event-interceptors'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [TextMessageHandler, VoiceStateHandler, DMHandler, ReadyHandler],
  interceptors: [TextMessageInterceptor, DMInterceptor],
})
export class HandlerModule {}
