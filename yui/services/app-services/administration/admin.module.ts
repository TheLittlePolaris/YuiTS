import { YuiModule } from '@/ioc-container/decorators'
import { AdministrationService } from './administration.service'
import { AdminstrationActionCommands } from './administration-actions/admin-action-command.service'

@YuiModule({
  components: [AdministrationService, AdminstrationActionCommands],
})
export class AdminModule {}
