import { YuiCore } from './yui-core'
import { HandlerModule } from './handlers/handler.module'
import { YuiClient } from './yui-client'
import { YuiModule } from './dep-injection-ioc/decorators'

@YuiModule({
  modules: [HandlerModule],
  components: [YuiCore, YuiClient],
  entryComponent: YuiCore, // Only define once
})
export class YuiCoreModule {}
