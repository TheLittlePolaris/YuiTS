import { YuiModule } from 'djs-ioc-container';

import { AdministrationCommands } from './admin-actions/administration-commands';
import { AdministrationService } from './administration.service';
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants';

@YuiModule({
  components: [AdministrationService],
  providers: [{ provide: ADMIN_ACTION_PROVIDER, useValue: new AdministrationCommands() }]
})
export class AdminModule {}
