import { YuiCore } from './yui-core'
import { HandlerModule } from './handlers/handler.module'
import { YuiClient } from './yui-client'
import { YuiModule } from './dep-injection-ioc/decorators'
import { GlobalInjectToken } from './dep-injection-ioc/constants/di-connstants'

@YuiModule({
  providers: [
    {
      provide: GlobalInjectToken.BOT_TOKEN,
      useValue: global.config.token,
    },
    {
      provide: GlobalInjectToken.BOT_PREFIX,
      useValue: global.config.prefix,
    },
  ],
  modules: [HandlerModule],
  components: [YuiCore, YuiClient],
  entryComponent: YuiCore, // Only define once
})
export class YuiCoreModule {}
