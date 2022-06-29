import { Message, EmbedFieldData } from 'discord.js'
import { discordRichEmbedConstructor } from '../app-services/utilities/discord-embed.util'
import { DiscordClient, Injectable } from '@/ioc-container'

@Injectable()
export class OwnerChannelService {
  constructor(private yuiClient: DiscordClient) {}

  async statistics(message: Message, args: Array<string>): Promise<void> {
    // const channels = this.yuiClient.channels.cache
    const guilds = this.yuiClient.guilds.cache
    const totalUsers = guilds
      .map((guild) => guild.members.cache.filter((member) => !member.user.bot).size)
      .reduce((total, curr) => total + curr, 0)

    const fields: EmbedFieldData[] = guilds.map((guild) => ({
      name: `**${guild.name}**`,
      value: `Channels: ${guild.channels.cache.size}\nUsers: ${
        guild.members.cache.filter((member) => !member.user.bot).size
      }`,
      inline: true
    }))
    const embed = discordRichEmbedConstructor({
      author: {
        authorName: this.yuiClient.user.username,
        avatarUrl: this.yuiClient.user.avatarURL()
      },
      title: 'Yui statistics',
      description: `**Guilds: ${guilds.size}\nUsers: ${totalUsers}**`,
      fields
    })

    message.channel.send({ embeds: [embed] })
  }
}
