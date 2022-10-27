import { Module } from '@tlp01/djs-ioc-container';

import { ConfigModule } from './config-service/config.module';
import { HandlerModule } from './event-handlers/handler.module';
import { providers } from './yui-app.providers';

@Module({
  modules: [ConfigModule, HandlerModule],
  providers
})
export class AppModule {}
