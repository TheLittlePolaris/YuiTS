import 'reflect-metadata';
import YuiCore from './yui-core';
import { errorLogger } from './handlers/error.handler';
import { ConfigService } from './env-config/config.service';
// Work In Progress...
// FIXME: Cannot config global import path
(async () => {
  try {
    ConfigService;
    console.log('Yui is starting...');
    const yui = new YuiCore();
    await yui.start();
  } catch (error) {
    errorLogger(error, 'YUI_START');
  }
})();
