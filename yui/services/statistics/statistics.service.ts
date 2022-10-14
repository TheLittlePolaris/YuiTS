import { APIEmbedField, Message } from 'discord.js';
import { Injectable, DiscordClient } from '@tlp01/djs-ioc-container';

import { discordRichEmbedConstructor } from '../utilities/discord-embed.util';

@Injectable()
export class OwnerChannelService {
  constructor(private readonly yuiClient: DiscordClient) {}

  async statistics(message: Message): Promise<void> {
    // const channels = this.yuiClient.channels.cache
    const guilds = this.yuiClient.guilds.cache;
    const totalUsers = guilds
      .map((guild) => guild.members.cache.filter((member) => !member.user.bot).size)
      .reduce((total, current) => total + current, 0);

    const fields: APIEmbedField[] = guilds.map((guild) => ({
      name: `**${guild.name}**`,
      value: `Channels: ${guild.channels.cache.size}\nUsers: ${
        guild.members.cache.filter((member) => !member.user.bot).size
      }`,
      inline: true
    }));
    const embed = discordRichEmbedConstructor({
      author: {
        authorName: this.yuiClient.user.username,
        avatarUrl: this.yuiClient.user.avatarURL()
      },
      title: 'Yui statistics',
      description: `**Guilds: ${guilds.size}\nUsers: ${totalUsers}**`,
      fields
    });

    message.channel.send({ embeds: [embed] });
  }
}
