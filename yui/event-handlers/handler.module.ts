import { VoiceStateEventHandler } from './voice-state.handler'
import { MessageCreateEventHandler } from './message.handler'
import { MusicModule } from '../services/app-services/music/music.module'
import { FeatureModule } from '../services/app-services/feature/feature.module'
import { AdminModule } from '../services/app-services/administration/admin.module'
import { OwnerServiceModule } from '../services/owner-service/owner-service.module'
import { DMEventHandler } from './dm.handler'
import { YuiModule } from '@/ioc-container/decorators'
import { ReadyEventHandler } from './ready.handler'
import { DMInterceptor, MessageCreateEventInterceptor } from './event-interceptors'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [MessageCreateEventHandler, VoiceStateEventHandler, DMEventHandler, ReadyEventHandler],
  interceptors: [MessageCreateEventInterceptor, DMInterceptor],
})
export class HandlerModule {}
