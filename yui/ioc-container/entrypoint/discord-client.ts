import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { Client, Message } from 'discord.js'

@Injectable()
export class DiscordClient extends Client {
  public get id() {
    return this.user.id
  }

  public async start(token: string) {
    return this.login(token)
  }

  public async getGuildMember(message: Message) {
    return message.guild.member(this.id)
  }
}
