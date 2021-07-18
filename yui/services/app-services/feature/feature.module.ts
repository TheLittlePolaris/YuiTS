import { YuiModule } from '@/ioc-container/decorators'
import { FeatureService } from './feature.service'
import { VTuberModule } from './vtuberstat-service/vtuber.module'

@YuiModule({
  components: [FeatureService],
  modules: [VTuberModule],
})
export class FeatureModule {}
