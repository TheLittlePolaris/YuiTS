import { HoloStatServiceInitiator } from '@/decorators/feature-holostat.decorator'
import {
  Message,
  GuildMember,
  EmbedFieldData,
  CollectorFilter,
  User,
  MessageReaction,
  MessageCollectorOptions,
  MessageEmbed,
  MessageOptions,
  GuildEmoji,
} from 'discord.js'
import {
  LOG_SCOPE,
  DISCORD_REACTION,
  holoStatReactionList,
  HOLOSTAT_KNOWN_REGION_CODE,
  HOLO_REGION_MAP,
} from '@/constants/constants'
import { errorLogger } from '@/handlers/log.handler'
import { discordRichEmbedConstructor } from '@/handlers/services/utilities/discord-embed-constructor'
import { HoloStatRequestService } from './holostat-request.service'
import { subscriberCountFormatter, dateTimeJSTFormatter } from '../feature-services/feature-utilities'

@HoloStatServiceInitiator()
export class HoloStatService {
  // constructor() {}

  public async holoStatSelectList(message: Message, regionCode?: HOLOSTAT_KNOWN_REGION_CODE): Promise<unknown> {
    if (!regionCode) {
      return this.getHoloRegion(message)
    }

    const isBilibili = regionCode === 'cn'

    const dataList = await HoloStatRequestService.getListChannels(regionCode)

    const fieldsData: EmbedFieldData[] = dataList.map((item, index) => ({
      name: `**${index + 1}**`,
      value: `**${item.snippet.title}**`,
      inline: true,
    }))

    const sentContent: Message[] = []

    const limit = 15
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit = index + limit >= fieldsData.length ? fieldsData.length : index + limit

      const sendingEmbed = await discordRichEmbedConstructor({
        description: `**Select the number dedicated to the channel name for detail${
          hasPaging ? ` (page ${index / limit + 1})` : ``
        }**`,
        fields: fieldsData.slice(index, currentPartLimit),
      })

      const sent = await this.sendMessage(message, sendingEmbed)

      sentContent.push(sent)

      if (!(currentPartLimit >= fieldsData.length)) sendPartial(currentPartLimit)

      return
    }
    sendPartial(0)

    const collectorFilter = (messageFilter: Message) =>
      messageFilter.author.id === message.author.id && messageFilter.channel.id === message.channel.id

    const collectorOptions: MessageCollectorOptions = {
      time: 30000,
      max: 1,
    }
    const collector = message.channel.createMessageCollector(collectorFilter, collectorOptions)

    const deleteSentContent = () => {
      sentContent.forEach((e) => e.delete().catch((err) => this.handleError(new Error(err))))
    }

    collector.on('collect', async (collected: Message) => {
      collector.stop()
      collected.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.content.toLowerCase() === 'cancel') {
        this.sendMessage(message, '**Canceled**')
        deleteSentContent()
        return
      } else {
        const selectedNumber = Number(collected.content)
        if (Number.isNaN(selectedNumber) || selectedNumber - 1 > dataList.length || selectedNumber - 1 < 0) {
          this.sendMessage(message, '**Please choose a valid number**')
          return
        }
        return this.holoStatChannelDetail(message, dataList[selectedNumber - 1].id, isBilibili)
      }
    })
    collector.on('end', (collected) => {
      if (sentContent) deleteSentContent()
      if (collected.size < 1) this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatChannelDetail(message: Message, channelId: string, isBilibili: boolean): Promise<void> {
    const channelData = await HoloStatRequestService.getSelectedChannelDetail(channelId, isBilibili).catch((err) =>
      this.handleError(new Error(err))
    )
    if (!channelData) {
      this.sendMessage(message, 'Something went wrong, please try again.')
    }

    const [subscriberCount, channelUrl, publishedDate] = isBilibili
      ? [channelData.statistics.subscriberCount, `https://space.bilibili.com/${channelData.id}`, `unknown`]
      : [
          subscriberCountFormatter(channelData.statistics.subscriberCount),
          `https://www.youtube.com/channel/${channelData.id}`,
          dateTimeJSTFormatter(channelData.snippet.publishedAt),
        ]

    const description = `**Description:** ${channelData.snippet.description}
    
    **Created date: \`${publishedDate}\`
    Subscriber count: \`${subscriberCount}\`
    View count: \`${channelData.statistics.viewCount}\`
    Video count: \`${channelData.statistics.videoCount}\`${
      isBilibili
        ? `
    Bilibili Live Room: [${channelData.bilibiliRoomInfo.title}](${channelData.bilibiliRoomInfo.url})`
        : ``
    }**`

    const embed = await discordRichEmbedConstructor({
      title: channelData.snippet.title,
      titleUrl: channelUrl,
      imageUrl: channelData.brandingSettings.image.bannerTvHighImageUrl,
      thumbnailUrl: channelData.snippet.thumbnails.high.url,
      description,
      color: channelData.brandingSettings.channel.profileColor,
    })

    await this.sendMessage(message, embed)

    return
  }

  public async getHoloRegion(message: Message): Promise<void> {
    const objKeys = Object.keys(holoStatReactionList)

    const content = `**Which region should i look for ? ${objKeys.map(
      (k, i) => `\n${i + 1}. ${holoStatReactionList[k].name}`
    )}**`

    const sentMessage = await this.sendMessage(message, content)

    if (!sentMessage) {
      this.sendMessage(message, '**Sorry, something went wrong.**')
      return
    }

    await Promise.all([objKeys.map((icon) => sentMessage.react(icon))]).catch((err) => this.handleError(new Error(err)))

    const filter: CollectorFilter = (reaction: MessageReaction, user: User) => {
      return objKeys.includes(reaction.emoji.name) && user.id === message.author.id
    }

    const collector = sentMessage.createReactionCollector(filter, {
      time: 15000,
      max: 1,
      maxEmojis: 1,
      maxUsers: 1,
    })

    collector.on('collect', (reaction: MessageReaction, user: User) => {
      collector.stop()
      const emojiName = reaction?.emoji?.name || DISCORD_REACTION.NUMBERS[0]
      const region = holoStatReactionList[emojiName].code
      if (!objKeys.includes(emojiName)) {
        this.sendMessage(message, '**Unknown reaction, using default region: Japan.**')
      }
      return this.holoStatSelectList(message, region).catch((err) => this.handleError(new Error(err)))
    })

    collector.on('end', (collected) => {
      if (sentMessage) sentMessage.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.size < 1) this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatStatistics(
    message: Message,
    yui: GuildMember,
    region?: HOLOSTAT_KNOWN_REGION_CODE
  ): Promise<void> {
    const isBilibili = region === 'cn'

    const waitingMessage = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    )

    const holoStatData = await HoloStatRequestService.getAllYoutubeHololiveMembersDetail(region).catch((error) =>
      this.handleError(new Error(error))
    )

    const fieldsData: EmbedFieldData[] = holoStatData.map((item) => {
      const fieldName = `${item.snippet.title}`
      const channelUrl = isBilibili
        ? `https://space.bilibili.com/${item.id}`
        : `https://www.youtube.com/channel/${item.id}`

      const fieldData = `Channel: [${item.snippet.title}](${channelUrl})\nSubscribers: ${
        isBilibili ? item.statistics.subscriberCount : subscriberCountFormatter(item.statistics.subscriberCount)
      }\nViews: ${item.statistics.viewCount}\nVideos: ${item.statistics.videoCount}`
      return {
        name: fieldName,
        value: fieldData,
        inline: true,
      }
    })

    if (fieldsData) waitingMessage.delete().catch((err) => this.handleError(new Error(err)))

    const limit = 18
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit = index + limit >= fieldsData.length ? fieldsData.length : index + limit

      const sendingEmbed = await discordRichEmbedConstructor({
        author: {
          authorName: yui.displayName,
          avatarUrl: yui.user.avatarURL(),
        },
        description: `Hololive ${HOLO_REGION_MAP[region]} members statistics${
          hasPaging ? ` page ${index / limit + 1}` : ``
        }`,
        fields: fieldsData.slice(index, currentPartLimit),
      })

      this.sendMessage(message, {
        embed: sendingEmbed,
      })

      if (!(currentPartLimit >= fieldsData.length)) sendPartial(currentPartLimit)

      return
    }

    sendPartial(0)
  }

  private async sendMessage(message: Message, content: string | MessageEmbed | MessageOptions) {
    return await message.channel.send(content).catch((err) => this.handleError(new Error(err)))
  }

  private handleError(error: Error | string) {
    return errorLogger(error, LOG_SCOPE.HOLOSTAT_SERVICE)
  }
}
