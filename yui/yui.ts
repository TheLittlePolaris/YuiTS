import 'module-alias/register';
import 'reflect-metadata';

import * as semver from 'semver';
import { RxjsContainerFactory } from '@tlp01/djs-ioc-container';

import { AppModule } from './yui-app.module';
import { ConfigService } from './config-service/config.service';
import { YuiLogger } from './logger/logger.service';

const bootstrap = async () => {
  const version = process.version.replace(/p{L}/g, '');
  if (semver.satisfies('>=16.6.0', version))
    throw new Error(
      `Incompatible node version: You are using node version ${process.version}. Yui requires node version >=16.6`
    );

  const container = new RxjsContainerFactory();
  const client = await container.initialize(AppModule);

  YuiLogger.info('🔸 Yui is starting...', 'BOOTSTRAP');
  const config = container.get(ConfigService);
  client.start(config.token);
};

bootstrap();
