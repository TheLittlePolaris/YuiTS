import { YuiModule } from '@tlp01/djs-ioc-container';

import { ConfigService } from './config.service';

@YuiModule({
  components: [ConfigService]
})
export class ConfigModule {}
