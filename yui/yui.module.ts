import { ConfigModule } from './config-service/config.module'
import { YuiCoreModule } from './entrypoint/yui-core.module'
import { YuiModule } from './ioc-container/decorators'


@YuiModule({
  modules: [ConfigModule, YuiCoreModule],
})
export class YuiMainModule {}
