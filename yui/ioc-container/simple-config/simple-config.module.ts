import { YuiModule } from "@/ioc-container/decorators";
import { SimpleConfigService } from "./simple-config.service";

@YuiModule({
  components: [SimpleConfigService],
})
export class SimpleConfigModule {}
