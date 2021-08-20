import { ClientEvents } from 'discord.js'
import { YuiLogger } from '@/services/logger/logger.service'
import { Interceptor } from '@/ioc-container/decorators/interceptor.decorator'
import { IBaseInterceptor } from '@/ioc-container/interfaces/interceptor.interface'

@Interceptor('messageCreate')
export class MessageCreateEventInterceptor implements IBaseInterceptor {
  intercept([message]: ClientEvents['messageCreate'], next: () => Promise<any>) {
    if (!(message.channel.type === 'GUILD_TEXT')) return
    console.time(`handle_message_${message.id}`)
    next()
      .then(() => console.timeEnd(`handle_message_${message.id}`))
      .catch((error) => {
        YuiLogger.error(error, MessageCreateEventInterceptor.name)
        message.channel.send('Something went wrong (╥_╥)')
      })
  }
}
