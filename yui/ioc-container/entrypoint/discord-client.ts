import { Client, ClientOptions, Message } from 'discord.js'

import { InjectToken } from '../constants'
import { Inject, Injectable } from '../decorators'
import { Logger } from '../logger'

@Injectable()
export class DiscordClient extends Client {
  constructor(@Inject(InjectToken.CLIENT_OPTIONS) options: ClientOptions) {
    super(options)
  }
  public get id() {
    return this.user.id
  }

  public async start(token: string) {
    Logger.log('💠 Connecting to Discord...')
    return this.login(token).then(() => {
      Logger.log('💠 Connected!')
    })
  }

  public getGuildMember(message: Message) {
    return message.guild.members.cache.get(this.id)
  }
}
