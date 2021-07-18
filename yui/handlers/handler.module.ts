import { VoiceStateHandler } from './voice-state.handler'
import { MessageHandler } from './message.handler'
import { YuiModule } from '@/ioc-container/decorators'
import { MusicModule } from '../services/app-services/music/music.module'
import { FeatureModule } from '../services/app-services/feature/feature.module'
import { AdminModule } from '../services/app-services/administration/admin.module'
import { OwnerServiceModule } from '../services/owner-service/owner-service.module'
import { MessageInterceptor } from '@/ioc-container/interceptors/message.interceptor'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  interceptors: [MessageInterceptor],
  components: [MessageHandler, VoiceStateHandler],
})
export class HandlerModule {}
