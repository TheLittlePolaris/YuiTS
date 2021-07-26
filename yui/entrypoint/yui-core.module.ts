import { YuiCore } from './yui-core.entrypoint'
import { YuiClient } from '../custom-classes/yui-client'
import { HandlerModule } from '@/event-handlers/handler.module'
import { YuiModule } from '@/ioc-container/decorators'
import { RedisModule } from '@/services/redis-adapter/redis.module'


@YuiModule({
  modules: [RedisModule, HandlerModule],
  components: [YuiCore, YuiClient],
  entryComponent: YuiCore, // Only define once
})
export class YuiCoreModule {}
