import { DMInterceptor } from '@/event-handlers/event-interceptors/dm-interceptor'
import { Handle, UseInterceptor } from '@/ioc-container/decorators'
import {
  Args,
  HandleMessage,
  MessageParam,
} from '@/ioc-container/decorators/command-handlers/message-handle.decorator'
import { OwnerChannelService } from '@/services/owner-service/channel.service'
import { Message } from 'discord.js'

@Handle('message')
@UseInterceptor(DMInterceptor)
export class DMHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleMessage('statistics', 'stat')
  async statistics(@MessageParam() message: Message, @Args() args: string[]): Promise<void> {
    return this.ownerChannelService.statistics(message, args)
  }
}
