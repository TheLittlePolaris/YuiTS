import {
  HoloStatServiceInitiator,
  HoloStatCommandValidator,
  Region,
  Detail,
} from '@/decorators/feature-holostat.decorator'
import {
  Message,
  GuildMember,
  EmbedFieldData,
  CollectorFilter,
  ReactionEmoji,
  User,
  MessageReaction,
  MessageCollectorOptions,
} from 'discord.js'
import {
  HOLOSTAT_REGION,
  LOG_SCOPE,
  DISCORD_REACTION,
  hololiveReactionList,
} from '@/constants/constants'
import { errorLogger } from '@/handlers/log.handler'
import { discordRichEmbedConstructor } from '@/handlers/services/music/music-utilities/discord-embed-constructor'
import { HoloStatRequestService } from './holo-stat-request.service'
import {
  subscriberCountFormatter,
  dateTimeJSTFormatter,
} from '../utility.service'

@HoloStatServiceInitiator()
export class HoloStatService {
  constructor() {}

  public async holoStatSelectList(message: Message, regionCode?: 'id' | 'jp') {
    if (!regionCode) {
      return this.getHoloRegion(message)
    }

    const dataList = await HoloStatRequestService.getListChannels(regionCode)

    const fieldsData: EmbedFieldData[] = dataList.map((item, index) => {
      return {
        name: `**${index + 1}**`,
        value: `**${item.snippet.title}**`,
        inline: true,
      }
    })

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

      const sent = await message.channel
        .send({ embed: sendingEmbed })
        .catch((err) => this.handleError(new Error(err)))
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
      try {
        sentContent.forEach((e) =>
          e.delete().catch((err) => this.handleError(new Error(err)))
        )
      } catch (err) {
        this.handleError(new Error(err))
      }
    }

    collector.on('collect', async (collected: Message) => {
      collector.stop()
      collected.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.content.toLowerCase() === 'cancel') {
        message.channel.send('**Canceled**')
        deleteSentContent()
        return
      } else {
        const selectedNumber = Number(collected.content)
        if (
          Number.isNaN(selectedNumber) ||
          selectedNumber - 1 > dataList.length ||
          selectedNumber - 1 < 0
        ) {
          message.channel.send('**Please chose a valid number**')
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
      if (collected.size < 1) message.channel.send(':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatChannelDetail(message: Message, channelId: string) {
    const channelData = await HoloStatRequestService.getSelectedChannelDetail(
      channelId
    ).catch((err) => this.handleError(new Error(err)))
    if (!channelData) {
      message.channel.send('Something went wrong, please try again.')
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

    await message.channel
      .send({ embed })
      .catch((err) => this.handleError(new Error(err)))

    return
  }

  public async getHoloRegion(message: Message) {
    const sentMessage = await message.channel
      .send(
        `**Which region should i look for ?\n1. ${hololiveReactionList['1️⃣'].name}\n2. ${hololiveReactionList['2️⃣'].name} **`
      )
      .catch((err) => this.handleError(new Error(err)))

    if (!sentMessage) {
      message.channel.send('**Sorry, something went wrong.**')
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
      region = hololiveReactionList[reaction['_emoji']['name']]['code']
      if (!region) {
        message.channel.send('**Unknown reaction. Action aborted.**')
      }
      return this.holoStatSelectList(message, region).catch((err) =>
        this.handleError(new Error(err))
      )
    })

    collector.on('end', (collected) => {
      if (sentMessage)
        sentMessage.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.size < 1) message.channel.send(':ok_hand: Action aborted.')
      return
    })
  }

  public async holoStatStatistics(
    message: Message,
    region: HOLOSTAT_REGION,
    yui: GuildMember
  ) {
    const waitingMessage = (await message.channel.send(
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    )) as Message

    const holoStatData = await HoloStatRequestService.getAllHololiveMembersDetail(
      region as 'id' | 'jp'
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

    const limit = 12
    const hasPaging = fieldsData.length > limit
    const sendPartial = async (index: number) => {
      const currentPartLimit =
        index + limit >= fieldsData.length ? fieldsData.length : index + limit

      const sendingEmbed = await discordRichEmbedConstructor({
        author: {
          embedTitle: yui.displayName,
          authorAvatarUrl: yui.user.avatarURL(),
        },
        description: `Hololive ${
          region === 'id' ? 'Indonesia' : 'Japan'
        } members statistics${hasPaging ? ` page ${index / limit + 1}` : ``}`,
        fields: fieldsData.slice(index, currentPartLimit),
      })

      message.channel
        .send({ embed: sendingEmbed })
        .catch((err) => this.handleError(new Error(err)))

      if (!(currentPartLimit >= fieldsData.length))
        sendPartial(currentPartLimit)

      return
    }

    sendPartial(0)
  }

  handleError(error: Error | string) {
    return errorLogger(error, LOG_SCOPE.HOLOSTAT_SERVICE)
  }
}
