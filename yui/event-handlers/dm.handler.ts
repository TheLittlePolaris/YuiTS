import { DMInterceptor } from '@/event-handlers/event-interceptors/dm.interceptor'
import { OnEvent, UseInterceptor } from '@/ioc-container/decorators'
import {
  Args,
  HandleCommand,
  MessageParam,
} from '@/ioc-container/decorators/event-handlers/message-handle.decorator'
import { OwnerChannelService } from '@/services/owner-service/channel.service'
import { Message } from 'discord.js'

@OnEvent('message')
@UseInterceptor(DMInterceptor)
export class DMHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleCommand('statistics', 'stat')
  async statistics(@MessageParam() message: Message, @Args() args: string[]): Promise<void> {
    return this.ownerChannelService.statistics(message, args)
  }
}
