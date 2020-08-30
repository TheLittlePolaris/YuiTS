import { YuiModule } from '@/decorators/dep-injection-ioc/decorators'
import { FeatureService } from './feature.service'
import { VTuberModule } from './vtuberstat-service/vtuber.module'

@YuiModule({
  components: [FeatureService],
  modules: [VTuberModule],
})
export class FeatureModule {}
