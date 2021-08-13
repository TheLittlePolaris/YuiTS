import { YuiModule } from "@/ioc-container/decorators";
import { SimpleConfigService } from "./config.service";

@YuiModule({
  components: [SimpleConfigService],
})
export class SimpleConfigModule {}
