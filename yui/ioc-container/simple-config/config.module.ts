import { YuiModule } from "../decorators";
import { ConfigService } from "./config.service";

@YuiModule({
  components: [ConfigService],
})
export class SimpleConfigModule {}
