import { ClientEvents } from 'discord.js'
import { YuiLogger } from '@/services/logger/logger.service'
import { Interceptor } from '@/ioc-container/decorators/interceptor.decorator'
import { IBaseInterceptor } from '@/ioc-container/interfaces/interceptor.interface'

@Interceptor('messageCreate')
export class MessageCreateEventInterceptor implements IBaseInterceptor {
  intercept([message]: ClientEvents['messageCreate'], next: () => Promise<any>) {
    if (!(message.channel.type === 'GUILD_TEXT')) return

    const label = `handle_message_${message.id}_[${message.content}]` //
    console.time(label)
    return next()
      .then(() => console.timeEnd(label))
      .catch((error) => {
        YuiLogger.error(error, MessageCreateEventInterceptor.name)
        message.channel.send('Something went wrong (╥_╥)')
      })
  }
}
