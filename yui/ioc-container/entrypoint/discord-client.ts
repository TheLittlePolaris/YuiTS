import { Inject, Injectable } from '@/ioc-container'
import { Client, IntentsString, Message } from 'discord.js'

@Injectable()
export class DiscordClient extends Client {
  constructor(@Inject('BOT_INTENTS') intents: IntentsString[]) {
    super({ intents })
  }
  public get id() {
    return this.user.id
  }

  public async start(token: string) {
    return this.login(token)
  }

  public getGuildMember(message: Message) {
    return message.guild.members.cache.get(this.id)
  }
}
