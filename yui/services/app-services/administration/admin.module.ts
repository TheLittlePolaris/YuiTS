import { YuiModule } from '@/ioc-container/decorators'
import { AdminCommandComponent, AdministrationService } from '.';

@YuiModule({
  components: [AdminCommandComponent, AdministrationService],
})
export class AdminModule {}
