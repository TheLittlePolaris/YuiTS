import 'module-alias/register'
import 'reflect-metadata'
import { ContainerFactory, DiscordClient } from './ioc-container'


import { YuiLogger } from './services/logger/logger.service'
import { AppModule } from './yui-app.module'

const bootstrap = async () => {
  const nodeVersion = /v(\d{1,2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
  if (Number(nodeVersion[1]) < 12) {
    throw new Error(
      `Incompatible node version: You are using node version ${nodeVersion[0]}. Yui require node version >=12.00 and <13.00.`
    )
  }
  const container = new ContainerFactory()

  const app: DiscordClient = await container.createRootModule(AppModule)

  YuiLogger.info('🔸 Yui is starting...', 'BOOTSTRAP')

  app.start(container.configService.token)
}

bootstrap()
