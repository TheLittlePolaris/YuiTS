import { YuiCoreModule } from './yui-core.module'
import { YuiModule } from './dep-injection-ioc/decorators'
import { ConfigService } from './config-service/config.service'
import { ConfigModule } from './config-service/config.module'
@YuiModule({
  modules: [ConfigModule, YuiCoreModule],
  components: [],
})
export class YuiMainModule {}
