import { Client, IntentsString, Message } from 'discord.js'

import { InjectToken } from '../constants'
import { Inject, Injectable } from '../decorators'

@Injectable()
export class DiscordClient extends Client {
  constructor(@Inject(InjectToken.CLIENT_INTENTS) intents: IntentsString[]) {
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
