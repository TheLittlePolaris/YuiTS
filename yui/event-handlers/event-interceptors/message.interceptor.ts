import { YuiLogger } from '@/services/logger/logger.service'
import { ClientEvents } from 'discord.js'
import { Interceptor } from '../../ioc-container/decorators/interceptor.decorator'
import { IBaseInterceptor } from '../../ioc-container/interfaces/interceptor.interface'

@Interceptor('message')
export class TextMessageInterceptor implements IBaseInterceptor {

  async intercept([message]: ClientEvents['message'], next: () => Promise<any>) {
    if (!(message.channel.type === 'text')) return
    console.time(`handle_m_${message.id}`)
    next()
      .then(() => {
        console.timeEnd(`handle_m_${message.id}`)
      })
      .catch((error) => {
        YuiLogger.error(error, TextMessageInterceptor.name)
        message.channel.send("Something went wrong (╥_╥)")
      })
  }
}
