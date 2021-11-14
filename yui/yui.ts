import 'module-alias/register'
import 'reflect-metadata'

import { ContainerFactory } from './ioc-container'
import { YuiLogger } from './services/logger/logger.service'
import { AppModule } from './yui-app.module'

const bootstrap = async () => {
  const nodeVersion = /v(\d{1,2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
  if (Number(nodeVersion[1]) < 16) {
    throw new Error(
      `Incompatible node version: You are using node version ${process.version}. Yui requires node version >=16.6.`
    )
  }
  const container = new ContainerFactory()
  const app = await container.createHandleModule(AppModule)

  YuiLogger.info('🔸 Yui is starting...', 'BOOTSTRAP')
  app.start(container.configService.token)
}

bootstrap()
