import { OwnerServiceInitiator } from '@/decorators/owner-service.decorator'
import {
  Message,
  DMChannel,
  Client,
  EmbedField,
  EmbedFieldData,
} from 'discord.js'
import { discordRichEmbedConstructor } from '../services/utilities/discord-embed-constructor'

@OwnerServiceInitiator()
export class OwnerChannelService {
  constructor() {}

  async statistics(message: Message, args: Array<string>, yui: Client) {
    const channels = yui.channels.cache
    const guilds = yui.guilds.cache
    const totalUsers = guilds
      .map(
        (guild) =>
          guild.members.cache.array().filter((member) => !member.user.bot)
            .length
      )
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
        authorName: yui.user.username,
        avatarUrl: yui.user.avatarURL(),
      },
      title: 'Yui statistics',
      description: `**Guilds: ${guilds.size}\nUsers: ${totalUsers}**`,
      fields,
    })
    message.channel.send(embed)
  }
}
