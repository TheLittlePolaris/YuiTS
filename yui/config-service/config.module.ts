import { YuiModule } from "@/dep-injection-ioc/decorators";
import { ConfigService } from "./config.service";

@YuiModule({
  components: [ConfigService],
})
export class ConfigModule {}
