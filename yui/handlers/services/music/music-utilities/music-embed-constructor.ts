import { RichEmbed } from "discord.js";
import { Constants } from "@/constants/constants";

interface IEmbedConstructor {
  title?: string;
  author?: { embedTitle?: string; authorAvatarUrl?: string };
  description: string;
  color?: string;
  thumbnailUrl?: string;
  appendTimeStamp?: boolean;
  titleUrl?: string;
  imageUrl?;
  footer?: string;
}

export function discordRichEmbedConstructor(
  records: IEmbedConstructor
): Promise<RichEmbed> {
  return new Promise((resolve, reject) => {
    const embed = new RichEmbed()
      .setColor(records.color || Constants.YUI_COLOR_CODE)
      .setDescription(records.description);

    if (records.title) embed.setTitle(records.title);
    if (records.author)
      embed.setAuthor(
        records.author.embedTitle,
        records.author.authorAvatarUrl || null
      );
    if (records.thumbnailUrl) embed.setThumbnail(records.thumbnailUrl);
    if (records.appendTimeStamp) embed.setTimestamp();
    if (records.titleUrl) embed.setURL(records.titleUrl);
    if (records.footer) embed.setFooter(records.footer);
    if (records.imageUrl) embed.setImage(records.imageUrl);

    resolve(embed);
  });
}
