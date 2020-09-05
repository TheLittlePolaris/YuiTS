import { YuiModule } from '@/dep-injection-ioc/decorators'
import { AdministrationService } from './administration.service'
import { AdminstrationActionCommands } from './administration-actions/action.service'

@YuiModule({
  components: [AdministrationService, AdminstrationActionCommands],
})
export class AdminModule {}
