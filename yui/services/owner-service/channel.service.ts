
import { Message,  EmbedFieldData } from 'discord.js'
import { discordRichEmbedConstructor } from '../app-services/utilities/discord-embed-constructor'
import { Injectable } from '@/dep-injection-ioc/decorators'
import { YuiClient } from '@/custom-classes/yui-client'

@Injectable()
export class OwnerChannelService {
  constructor(private yuiClient: YuiClient) {}

  async statistics(message: Message, args: Array<string>): Promise<void> {
    const channels = this.yuiClient.channels.cache
    const guilds = this.yuiClient.guilds.cache
    const totalUsers = guilds
      .map((guild) => guild.members.cache.array().filter((member) => !member.user.bot).length)
      .reduce((total, curr) => total + curr, 0)

    const fields: EmbedFieldData[] = guilds.map((guild) => ({
      name: `**${guild.name}**`,
      value: `Channels: ${guild.channels.cache.size}\nUsers: ${
        guild.members.cache.array().filter((member) => !member.user.bot).length
      }`,
      inline: true,
    }))
    const embed = await discordRichEmbedConstructor({
      author: {
        authorName: this.yuiClient.user.username,
        avatarUrl: this.yuiClient.user.avatarURL(),
      },
      title: 'Yui statistics',
      description: `**Guilds: ${guilds.size}\nUsers: ${totalUsers}**`,
      fields,
    })
    message.channel.send(embed)
  }
}