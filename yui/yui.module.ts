import { YuiCoreModule } from './yui-core.module'
import { YuiModule } from './dep-injection-ioc/decorators'
import { ConfigModule } from './config-service/config.module'
@YuiModule({
  modules: [ConfigModule, YuiCoreModule],
})
export class YuiMainModule {}
