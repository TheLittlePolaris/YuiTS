import { YuiCore } from './yui-core'
import { INJECT_TOKEN } from './constants/constants'
import { HandlerModule } from './handlers/handler.module'
import { YuiClient } from './yui-client'
import { YuiModule } from './decorators/dep-injection-ioc/decorators'

@YuiModule({
  providers: [
    {
      provide: INJECT_TOKEN.BOT_TOKEN,
      useValue: global.config.token,
    },
    {
      provide: INJECT_TOKEN.BOT_PREFIX,
      useValue: global.config.prefix,
    },
  ],
  modules: [HandlerModule],
  components: [YuiCore, YuiClient],
  entryComponent: YuiCore, // Only define once
})
export class YuiCoreModule {}
