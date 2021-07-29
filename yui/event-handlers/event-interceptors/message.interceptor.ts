import { YuiLogger } from '@/services/logger/logger.service'
import { ClientEvents } from 'discord.js'
import { Interceptor } from '../../ioc-container/decorators/interceptor.decorator'
import { IBaseInterceptor } from '../../ioc-container/interfaces/interceptor.interface'

@Interceptor('message')
export class TextMessageInterceptor implements IBaseInterceptor {

  async intercept([message]: ClientEvents['message'], next: () => Promise<any>) {
    if (!(message.channel.type === 'text')) return
    console.time(`Text command handler`)
    next()
      .then(() => {
        console.timeEnd(`Text command handler`)
      })
      .catch((err) => {
        YuiLogger.error(err, TextMessageInterceptor.name)
        message.channel.send("Something went wrong (╥_╥)")
      })
  }
}
