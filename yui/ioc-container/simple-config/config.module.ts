import { YuiModule } from "../decorators";
import { SimpleConfigService } from "./config.service";

@YuiModule({
  components: [SimpleConfigService],
})
export class SimpleConfigModule {}
