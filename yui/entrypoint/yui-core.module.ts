import { YuiCore } from './yui-core.entrypoint'
import { YuiClient } from '../custom-classes/yui-client'
import { RedisModule } from '@/redis-adapter/redis.module'
import { YuiModule } from '@/ioc-container/decorators'
import { HandlerModule } from '@/handlers/handler.module'


@YuiModule({
  modules: [RedisModule, HandlerModule],
  components: [YuiCore, YuiClient],
  entryComponent: YuiCore, // Only define once
})
export class YuiCoreModule {}
