import { YuiModule } from 'djs-ioc-container'
import { ConfigService } from './config.service'

@YuiModule({
  components: [ConfigService]
})
export class ConfigModule {}
