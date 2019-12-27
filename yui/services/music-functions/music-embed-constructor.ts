import { RichEmbed } from "discord.js";

interface IEmbedConstructor {
  title: string;
  embedStatus: string;
  authorAvatarUrl: string;
  description: string;
  color: string;
  thumbnailUrl?: string;
  appendTimeStamp?: boolean;
  titleHyperLink?: string;
  footer?: string;
}

export function discordRichEmbedConstructor(
  records: IEmbedConstructor
): Promise<RichEmbed> {
  return new Promise((resolve, reject) => {
    const embed = new RichEmbed()
      .setTitle(records.title)
      .setAuthor(records.embedStatus, records.authorAvatarUrl)
      .setDescription(records.description)
      .setColor(records.color);

    if (records.thumbnailUrl) embed.setThumbnail(records.thumbnailUrl);
    if (records.appendTimeStamp) embed.setTimestamp();
    if (records.titleHyperLink) embed.setURL(records.titleHyperLink);
    if (records.footer) embed.setFooter(records.footer);

    resolve(embed);
  });
}
