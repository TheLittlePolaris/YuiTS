import { Client, ClientOptions, Guild, Message } from 'discord.js'

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

  public getGuildMemberByMessage(message: Message) {
    return message.guild.members?.cache.get(this.id)
  }

  public getGuildMemberByGuild(guild: Guild) {
    return guild.members?.cache.get(this.id)
  }

  public getGuildMemberByGuildId(guildId: string) {
    return this.guilds.cache?.get(guildId)?.members?.cache.get(this.id)
  }

  public getDisplayName({ message, guild, guildId }: { message?: Message; guild?: Guild; guildId?: string }): string {
    if (message) return this.getGuildMemberByMessage(message).displayName
    if (guild) return this.getGuildMemberByGuild(guild).displayName
    if (guildId) return this.getGuildMemberByGuildId(guildId).displayName

    return this.user.username
  }
}
