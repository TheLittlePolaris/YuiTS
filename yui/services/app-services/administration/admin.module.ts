import { AdministrationService } from './administration.service'
import { AdminCommandComponent } from './administration-actions/admin-action-command.service'
import { YuiModule } from '@/ioc-container/decorators'

@YuiModule({
  components: [AdministrationService, AdminCommandComponent],
})
export class AdminModule {}
