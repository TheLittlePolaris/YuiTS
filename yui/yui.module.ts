import { YuiModule } from './dep-injection-ioc/decorators'
import { ConfigModule } from './config-service/config.module'
import { YuiCoreModule } from './entrypoint/yui-core.module'
@YuiModule({
  modules: [ConfigModule, YuiCoreModule],
})
export class YuiMainModule {}
