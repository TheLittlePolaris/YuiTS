import { VoiceStateHandler } from './voice-state.handler'
import { MessageHandler } from './message.handler'
import { YuiModule } from '@/ioc-container/decorators'
import { MusicModule } from '../services/app-services/music/music.module'
import { FeatureModule } from '../services/app-services/feature/feature.module'
import { AdminModule } from '../services/app-services/administration/admin.module'
import { OwnerServiceModule } from '../services/owner-service/owner-service.module'
import { TextMessageInterceptor } from '@/interceptors/message.interceptor'
import { DMInterceptor } from '@/interceptors/dm-interceptor'
import { DMHandler } from './dm.handler'

@YuiModule({
  modules: [MusicModule, FeatureModule, AdminModule, OwnerServiceModule],
  components: [MessageHandler, VoiceStateHandler, DMHandler],
  interceptors: [TextMessageInterceptor, DMInterceptor],
})
export class HandlerModule {}
