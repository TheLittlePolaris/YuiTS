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
  HOLOLIVE_REACTION_LIST,
} from '@/constants/constants'
import { errorLogger } from '@/handlers/log.handler'
import { discordRichEmbedConstructor } from '@/handlers/services/utilities/discord-embed-constructor'
import { HoloStatRequestService } from './holostat-request.service'
import {
  subscriberCountFormatter,
  dateTimeJSTFormatter,
} from '../feature-services/feature-utilities'

@HoloStatServiceInitiator()
export class HoloStatService {
  constructor() {}

  public async holoStatSelectList(message: Message, regionCode?: 'id' | 'jp') {
    if (!regionCode) {
      return this.getHoloRegion(message)
    }

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

      if (!(currentPartLimit >= fieldsData.length))
        sendPartial(currentPartLimit)

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
    const collector = message.channel.createMessageCollector(
      collectorFilter,
      collectorOptions
    )

    const deleteSentContent = () => {
      sentContent.forEach((e) =>
        e.delete().catch((err) => this.handleError(new Error(err)))
      )
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
        if (
          Number.isNaN(selectedNumber) ||
          selectedNumber - 1 > dataList.length ||
          selectedNumber - 1 < 0
        ) {
          this.sendMessage(message, '**Please choose a valid number**')
          return
        }
        return this.holoStatChannelDetail(
          message,
          dataList[selectedNumber - 1].id
        )
      }
    })
    collector.on('end', (collected) => {
      if (sentContent) deleteSentContent()
      if (collected.size < 1)
        this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatChannelDetail(message: Message, channelId: string) {
    const channelData = await HoloStatRequestService.getSelectedChannelDetail(
      channelId
    ).catch((err) => this.handleError(new Error(err)))
    if (!channelData) {
      this.sendMessage(message, 'Something went wrong, please try again.')
    }

    const description = `**Description:** ${
      channelData.snippet.description
    }\n\n**Created date: \`${dateTimeJSTFormatter(
      channelData.snippet.publishedAt
    )}\`\nSubscriber count: \`${subscriberCountFormatter(
      channelData.statistics.subscriberCount
    )}\`\nView count: \`${channelData.statistics.viewCount}\`\nVideo count: \`${
      channelData.statistics.videoCount
    }\`**`

    const embed = await discordRichEmbedConstructor({
      title: channelData.snippet.title,
      titleUrl: `https://www.youtube.com/channel/${channelData.id}`,
      imageUrl: channelData.brandingSettings.image.bannerTvHighImageUrl,
      thumbnailUrl: channelData.snippet.thumbnails.high.url,
      description,
      color: channelData.brandingSettings.channel.profileColor,
    })

    await this.sendMessage(message, embed)

    return
  }

  public async getHoloRegion(message: Message) {
    const sentMessage = await this.sendMessage(
      message,
      `**Which region should i look for ?\n1. ${HOLOLIVE_REACTION_LIST['1️⃣'].name}\n2. ${HOLOLIVE_REACTION_LIST['2️⃣'].name} **`
    )

    if (!sentMessage) {
      this.sendMessage(message, '**Sorry, something went wrong.**')
      return
    }

    await Promise.all([
      DISCORD_REACTION.NUMBERS.slice(0, 2).map((icon) =>
        sentMessage.react(icon)
      ),
    ]).catch((err) => this.handleError(new Error(err)))

    const filter: CollectorFilter = (reaction: MessageReaction, user: User) => {
      return (
        DISCORD_REACTION.NUMBERS.slice(0, 2).includes(reaction.emoji.name) &&
        user.id === message.author.id
      )
    }

    let region: 'jp' | 'id' = 'jp'

    const collector = sentMessage.createReactionCollector(filter, {
      time: 15000,
      max: 1,
      maxEmojis: 1,
      maxUsers: 1,
    })

    collector.on('collect', (reaction: MessageReaction, user: User) => {
      collector.stop()
      region = HOLOLIVE_REACTION_LIST[reaction.emoji?.name]?.code || 'jp'
      if (!region) {
        return this.sendMessage(
          message,
          '**Unknown reaction. Action aborted.**'
        )
      }
      return this.holoStatSelectList(message, region).catch((err) =>
        this.handleError(new Error(err))
      )
    })

    collector.on('end', (collected) => {
      if (sentMessage)
        sentMessage.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.size < 1)
        this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatStatistics(
    message: Message,
    yui: GuildMember,
    region?: 'id' | 'jp'
  ) {
    const waitingMessage = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    )

    const holoStatData = await HoloStatRequestService.getAllHololiveMembersDetail(
      region
    ).catch((error) => this.handleError(new Error(error)))

    const fieldsData: EmbedFieldData[] = holoStatData.map((item) => {
      const fieldName = `${item.snippet.title}`
      const fieldData = `Channel: [${
        item.snippet.title
      }](https://www.youtube.com/channel/${
        item.id
      })\nSubscribers: ${subscriberCountFormatter(
        item.statistics.subscriberCount
      )}\nViews: ${item.statistics.viewCount}\nVideos: ${
        item.statistics.videoCount
      }`
      return { name: fieldName, value: fieldData, inline: true }
    })

    if (fieldsData)
      waitingMessage.delete().catch((err) => this.handleError(new Error(err)))

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
        description: `Hololive ${
          region === 'id' ? 'Indonesia' : 'Japan'
        } members statistics${hasPaging ? ` page ${index / limit + 1}` : ``}`,
        fields: fieldsData.slice(index, currentPartLimit),
      })

      this.sendMessage(message, { embed: sendingEmbed })

      if (!(currentPartLimit >= fieldsData.length))
        sendPartial(currentPartLimit)

      return
    }

    sendPartial(0)
  }

  private async sendMessage(
    message: Message,
    content: string | MessageEmbed | MessageOptions
  ) {
    return await message.channel
      .send(content)
      .catch((err) => this.handleError(new Error(err)))
  }

  private handleError(error: Error | string) {
    return errorLogger(error, LOG_SCOPE.HOLOSTAT_SERVICE)
  }
}
