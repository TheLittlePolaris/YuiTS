import { YuiCoreModule } from './yui-core.module'
import { YuiModule } from './dep-injection-ioc/decorators'
@YuiModule({
  modules: [YuiCoreModule],
  components: [],
})
export class YuiMainModule {}
