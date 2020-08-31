import { OwnerServiceInitiator } from '@/decorators/owner-service.decorator'
import { Message, DMChannel, Client, EmbedField, EmbedFieldData } from 'discord.js'
import { discordRichEmbedConstructor } from '../services/utilities/discord-embed-constructor'
import { YuiClient } from '@/yui-client'

@OwnerServiceInitiator()
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
