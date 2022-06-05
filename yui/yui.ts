import 'module-alias/register'
import 'reflect-metadata'
import { RxjsContainerFactory } from '@/ioc-container'
import { AppModule } from './yui-app.module'
import { ConfigService } from './config-service/config.service'
import { YuiLogger } from './services/logger/logger.service'

const bootstrap = async () => {
  const [major, _minor, _patch] = /v(\d{1,2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
  if (Number(major) < 16) {
    throw new Error(
      `Incompatible node version: You are using node version ${process.version}. Yui requires node version >=16.6.`
    )
  }
  const container = new RxjsContainerFactory()
  const client = await container.initialize(AppModule)

  YuiLogger.info('🔸 Yui is starting...', 'BOOTSTRAP')
  const config = container.get(ConfigService)
  client.start(config.token)
}

bootstrap()
