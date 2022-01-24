import { YuiModule } from "@/ioc-container/decorators";
import { ConfigService } from "./config.service";

@YuiModule({
  components: [ConfigService],
})
export class ConfigModule {}
