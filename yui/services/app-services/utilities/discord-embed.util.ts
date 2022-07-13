import { MessageEmbed, EmbedFieldData, HexColorString } from 'discord.js'
import { AppConfig } from '@/constants'

interface IEmbedConstructor {
  title?: string
  titleUrl?: string
  author?: { authorName?: string; avatarUrl?: string }
  description: string
  fields?: EmbedFieldData[] | EmbedFieldData[][]
  color?: string
  thumbnailUrl?: string
  appendTimeStamp?: boolean
  imageUrl?: string
  footer?: string
}

export function discordRichEmbedConstructor(records: IEmbedConstructor) {
  const embed = new MessageEmbed()
    .setColor((records.color as HexColorString) || AppConfig.YUI_COLOR_CODE)
    .setDescription(records.description)

  if (records.title) embed.setTitle(records.title)
  if (records.author) embed.setAuthor(records.author.authorName, records.author.avatarUrl || null)

  if (records.fields?.length) embed.addFields(...records.fields)
  if (records.thumbnailUrl) embed.setThumbnail(records.thumbnailUrl)
  if (records.appendTimeStamp) embed.setTimestamp()
  if (records.titleUrl) embed.setURL(records.titleUrl)
  if (records.footer) embed.setFooter(records.footer)
  if (records.imageUrl) embed.setImage(records.imageUrl)

  return embed
}
