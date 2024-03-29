import { Module } from '@tlp01/djs-ioc-container';

import { AdministrationCommands } from './admin-actions/administration-commands';
import { AdministrationService } from './administration.service';
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants';

@Module({
  components: [AdministrationService],
  providers: [{ provide: ADMIN_ACTION_PROVIDER, useValue: new AdministrationCommands() }]
})
export class AdminModule {}
