import { AdministrationService } from './administration.service'
import { AdminstrationActionCommands } from './administration-actions/admin-action-command.service'
import { YuiModule } from '@/ioc-container/decorators'

@YuiModule({
  components: [AdministrationService, AdminstrationActionCommands],
})
export class AdminModule {}
