import { YuiCoreModule } from './yui-core.module'
import { YuiModule } from './decorators/dep-injection-ioc/decorators'
@YuiModule({
  modules: [YuiCoreModule],
  components: [],
})
export class YuiMainModule {}
