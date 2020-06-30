import { VtuberStatServiceInitiator } from '@/decorators/feature-holostat.decorator'
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
import { LOG_SCOPE } from '@/constants/constants'
import { errorLogger, debugLogger } from '@/handlers/log.handler'
import { discordRichEmbedConstructor } from '@/handlers/services/utilities/discord-embed-constructor'
import { HoloStatRequestService } from './holostat-service/holostat-request.service'
import { subscriberCountFormatter, dateTimeJSTFormatter } from '../feature-services/feature-utilities'
import { HOLO_KNOWN_REGION, holoStatReactionList, HOLO_REGION_MAP } from './holostat-service/holostat.interface'
import { nijiStatReactionList, NIJI_REGION_MAP, NIJI_KNOWN_REGION } from './nijistat-service/nijistat.interface'
import { KNOWN_AFFILIATION } from '../feature-interfaces/vtuber-stat.interface'
import { NijiStatRequestService } from './nijistat-service/nijistat-request.service'
import { ChannelDetailService } from './channel-service/channel-detail.service'

@VtuberStatServiceInitiator()
export class VtuberStatService {
  constructor() {
    debugLogger('VtuberStatService')
  }

  public async vtuberStatSelectList({
    message,
    affiliation = 'Hololive',
    regionCode,
  }: {
    message: Message
    affiliation: KNOWN_AFFILIATION
    regionCode?: HOLO_KNOWN_REGION | NIJI_KNOWN_REGION
  }): Promise<unknown> {
    if (!regionCode) {
      return this.getRegion({ message, affiliation })
    }

    console.log(regionCode, ' <==== REGION CODE')

    const isBilibili = regionCode === 'cn'
    const service = affiliation === 'Hololive' ? HoloStatRequestService : NijiStatRequestService
    const dataList = await service.getChannelList(regionCode).catch((err) => this.handleError(new Error(err)))

    if (!dataList || !dataList.length) return this.sendMessage(message, '**Something went wrong :(**')

    const fieldsData: EmbedFieldData[] = dataList.map((item, index) => ({
      name: `**${index + 1}**`,
      value: `**${item.snippet.title}**`,
      inline: true,
    }))

    const sentContent: Message[] = []

    const limit = 20
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
        if (Number.isNaN(selectedNumber) || selectedNumber > dataList.length || selectedNumber < 1) {
          this.sendMessage(message, '**Please choose a valid number**')
          return
        }
        return this.getChannelDetail({ message, channelId: dataList[selectedNumber - 1]?.id, isBilibili })
      }
    })
    collector.on('end', (collected) => {
      if (sentContent) deleteSentContent()
      if (collected.size < 1) this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async getChannelDetail({
    message,
    channelId,
    isBilibili,
  }: {
    message: Message
    channelId: string
    isBilibili: boolean
  }): Promise<void> {
    const channelData = await ChannelDetailService.getSelectedChannelDetail({ channelId, isBilibili }).catch((err) =>
      this.handleError(new Error(err))
    )
    if (!channelData) {
      this.sendMessage(message, 'Something went wrong, please try again.')
    }

    const [subscriberCount, channelUrl, publishedDate] = isBilibili
      ? [channelData.statistics.subscriberCount, `https://space.bilibili.com/${channelData.id}`, `N/A`]
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

  public async getRegion({
    message,
    affiliation = 'Hololive',
  }: {
    message: Message
    affiliation?: KNOWN_AFFILIATION
  }): Promise<void> {
    const reactionList = affiliation === 'Hololive' ? holoStatReactionList : nijiStatReactionList

    const objKeys = Object.keys(reactionList)

    const content = `**Which region should i look for ? ${objKeys.map(
      (k, i) => `\n${i + 1}. ${reactionList[k].name}`
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
      const emojiName = reaction?.emoji?.name || '1️⃣'
      const region = reactionList[emojiName].code
      if (!objKeys.includes(emojiName)) {
        this.sendMessage(message, '**Unknown reaction, using default region: Japan.**')
      }
      return this.vtuberStatSelectList({ message, affiliation, regionCode: region }).catch((err) =>
        this.handleError(new Error(err))
      )
    })

    collector.on('end', (collected) => {
      if (sentMessage) sentMessage.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.size < 1) this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async vtuberStatStatistics({
    message,
    yui,
    affiliation,
    region,
  }: {
    message: Message
    yui: GuildMember
    affiliation: KNOWN_AFFILIATION
    region?: HOLO_KNOWN_REGION
  }): Promise<void> {
    const waitingMessage = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    )

    const isBilibili = region === 'cn'
    const service = affiliation === 'Hololive' ? HoloStatRequestService : NijiStatRequestService
    const holoStatData = await service
      .getAllMembersChannelDetail(region)
      .catch((error) => this.handleError(new Error(error)))

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

    const regionMap = affiliation === 'Hololive' ? HOLO_REGION_MAP : NIJI_REGION_MAP

    const limit = 18
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit = index + limit >= fieldsData.length ? fieldsData.length : index + limit

      const sendingEmbed = await discordRichEmbedConstructor({
        author: {
          authorName: yui.displayName,
          avatarUrl: yui.user.avatarURL(),
        },
        description: `${affiliation} ${regionMap[region]} members statistics${
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
