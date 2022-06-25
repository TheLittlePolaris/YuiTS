import { YuiModule } from '@/ioc-container/decorators'
import { AdministrationCommands, AdministrationService } from '.'
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants'

@YuiModule({
  components: [AdministrationCommands, AdministrationService],
  providers: [{ provide: ADMIN_ACTION_PROVIDER, useValue: new AdministrationCommands() }]
})
export class AdminModule {}
