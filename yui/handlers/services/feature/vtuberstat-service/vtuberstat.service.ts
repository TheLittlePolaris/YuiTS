
import {
  Message,
  GuildMember,
  EmbedFieldData,
  MessageCollectorOptions,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { LOG_SCOPE } from '@/constants/constants'
import { discordRichEmbedConstructor } from '@/handlers/services/utilities/discord-embed-constructor'
import { HoloStatRequestService } from './holostat-service/holostat-request.service'
import {
  subscriberCountFormatter,
  dateTimeJSTFormatter,
} from '../feature-services/feature-utilities'
import {
  HOLO_KNOWN_REGION,
  HOLO_REGION_MAP,
  holoStatList,
} from './holostat-service/holostat.interface'

import { KNOWN_AFFILIATION } from '../feature-interfaces/vtuber-stat.interface'
import { BilibiliChannelService } from './channel-service/bilibili-channel.service'
import { YoutubeChannelService } from './channel-service/youtube-channel.service'
import { YuiLogger } from '@/log/logger.service'
import { Injectable } from '@/dep-injection-ioc/decorators'

@Injectable()
export class VtuberStatService {
  constructor(
    private holostatRequestService: HoloStatRequestService,
    private youtubeRequestService: YoutubeChannelService,
    private bilibiliRequestService: BilibiliChannelService
  ) {
    YuiLogger.info('Created!', LOG_SCOPE.VTUBER_STAT_SERVICE)
  }

  public async vtuberStatSelectList({
    message,
    affiliation = 'Hololive',
    regionCode,
  }: {
    message: Message
    affiliation: KNOWN_AFFILIATION
    regionCode?: HOLO_KNOWN_REGION
  }): Promise<unknown> {
    if (!regionCode) {
      return this.getRegion({ message, affiliation })
    }

    const service = this.holostatRequestService
    const dataList = await service
      .getChannelList(regionCode as any)
      .catch((err) => this.handleError(new Error(err)))

    if (!dataList || !dataList.length)
      return this.sendMessage(message, '**Something went wrong :(**')

    const fieldsData: EmbedFieldData[] = dataList.map((item, index) => ({
      name: `**${index + 1}**`,
      value: `**${item.snippet.title}**`,
      inline: true,
    }))

    const sentContent: Message[] = []

    const limit = 20
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit =
        index + limit >= fieldsData.length ? fieldsData.length : index + limit

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
      messageFilter.author.id === message.author.id &&
      messageFilter.channel.id === message.channel.id

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

      const selected = /^\d{1,2}|cancel$/.exec(collected.content)
      if (!selected) return this.sendMessage(message, '**Please choose a valid number**')
      const option = selected[0]
      if (option === 'cancel') {
        this.sendMessage(message, '**Canceled**')
        deleteSentContent()
        return
      } else {
        const selectedNumber = Number(option) //number is valid
        return this.getChannelDetail({
          message,
          channelId: dataList[selectedNumber - 1]?.id,
        })
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
  }: {
    message: Message
    channelId: string
  }): Promise<void> {
    const service = this.youtubeRequestService
    const channelData = await service.getSelectedChannelDetail(channelId)
    if (!channelData) {
      this.sendMessage(message, 'Something went wrong, please try again.')
    }

    const [subscriberCount, channelUrl, publishedDate] = [
      subscriberCountFormatter(channelData.statistics.subscriberCount),
      `https://www.youtube.com/channel/${channelData.id}`,
      dateTimeJSTFormatter(channelData.snippet.publishedAt),
    ]

    const description = `**Description:** ${channelData.snippet.description}
    
    **Created date: \`${publishedDate}\`
    Subscribers: \`${subscriberCount}\`
    Views: \`${channelData.statistics.viewCount}\`
    Videos: \`${channelData.statistics.videoCount}\`**`

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
    const reactionList = holoStatList

    const regionCodes = Object.keys(reactionList)

    const content = `**Which region should i look for ? ${regionCodes.map(
      (k, i) => `\n${i + 1}. ${reactionList[k].name}`
    )}**`
    const sentMessage = await this.sendMessage(message, content)
    if (!sentMessage) {
      this.sendMessage(message, '**Sorry, something went wrong.**')
      return
    }
    const collectorFilter = (messageFilter: Message) =>
      messageFilter.author.id === message.author.id &&
      messageFilter.channel.id === message.channel.id

    const collectorOptions: MessageCollectorOptions = {
      time: 15000,
      max: 1,
    }
    const collector = sentMessage.channel.createMessageCollector(collectorFilter, collectorOptions)

    collector.on('collect', (collected: Message) => {
      collector.stop()

      const selected = /^[1-4]|cancel$/.exec(collected.content)
      if (!selected) return this.sendMessage(message, 'Invailid option! Action aborted.')
      const option = selected[0]
      if (option === 'cancel') {
        this.sendMessage(message, '**`Canceled!`**')
        this.deleteMessage(sentMessage)
        return
      } else {
        const index = Number(option)
        return this.vtuberStatSelectList({
          message,
          affiliation,
          regionCode: regionCodes[index - 1] as any,
        }).catch((err) => this.handleError(new Error(err)))
      }
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

    const service = this.holostatRequestService

    console.log(service, `<======= service [vtuberstat.service.ts - 268]`)
    const holoStatData = await service.getAllMembersChannelDetail(region as any)

    const fieldsData: EmbedFieldData[] = holoStatData.map((item) => {
      const fieldName = `${item.snippet.title}`
      const channelUrl = `https://www.youtube.com/channel/${item.id}`

      const fieldData = `Channel: [${
        item.snippet.title
      }](${channelUrl})\nSubscribers: ${subscriberCountFormatter(
        item.statistics.subscriberCount
      )}\nViews: ${item.statistics.viewCount}\nVideos: ${item.statistics.videoCount}`
      return {
        name: fieldName,
        value: fieldData,
        inline: true,
      }
    })

    if (fieldsData) waitingMessage.delete().catch((err) => this.handleError(new Error(err)))

    const regionMap = HOLO_REGION_MAP

    const limit = 18
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit =
        index + limit >= fieldsData.length ? fieldsData.length : index + limit

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

  private async sendMessage(
    message: Message,
    content: string | MessageEmbed | MessageOptions
  ): Promise<Message> {
    return await message.channel
      .send(content as any)
      .catch((err) => this.handleError(new Error(err)))
  }

  private async deleteMessage(
    message: Message,
    option: { timeout?: number; reason?: string } = {}
  ) {
    return await message.delete(option).catch((err) => this.handleError(err))
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, LOG_SCOPE.HOLOSTAT_SERVICE)
    return null
  }
}
