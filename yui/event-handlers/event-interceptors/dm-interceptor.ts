import { ConfigService } from '@/config-service/config.service'
import { ClientEvents } from 'discord.js'
import { Interceptor } from '../../ioc-container/decorators/interceptor.decorator'
import { IBaseInterceptor } from '../../ioc-container/interfaces/interceptor.interface'

@Interceptor('message')
export class DMInterceptor implements IBaseInterceptor {
  constructor(private configService: ConfigService) {}

  async intercept([message]: ClientEvents['message'], next: () => Promise<any>) {
    if (!(message.channel.type === 'dm' && message.author.id === this.configService.ownerId)) return
    console.time(`command_handler`)
    next().then(() => {
      console.timeEnd(`command_handler`)
    })
  }
}
