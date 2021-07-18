import { Injectable } from '@/ioc-container/decorators'
import { Client, Message } from 'discord.js'

@Injectable()
export class YuiClient extends Client {
  public get id() {
    return this.user.id
  }

  public async getMember(message: Message) {
    return message.guild.members.fetch(this.id)
  }
}
