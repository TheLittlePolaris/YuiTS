import { debugLogger, errorLogger } from '@/handlers/log.handler'
import {
  Message,
  GuildMember,
  EmbedFieldData,
  MessageEmbedOptions,
} from 'discord.js'
import { discordRichEmbedConstructor } from '../music/music-utilities/discord-embed-constructor'
import {
  isMyOwner,
  tenorRequestService,
} from './feature-services/utility.service'
import { RNG } from '../music/music-utilities/music-function'
import {
  FeatureServiceInitiator,
  CurrentGuildMember,
  ValidateFeaturePermission,
  MentionedUsers,
  UserAction,
  RequestParams,
} from '@/decorators/features.decorator'
import { ValidatePermissions } from '@/decorators/permission.decorator'
import { HoloStatService } from './feature-services/holo-stat.service'
import { Constants } from '@/constants/constants'

@FeatureServiceInitiator()
export class FeatureService {
  constructor() {
    debugLogger('FeatureService')
  }

  @ValidateFeaturePermission()
  public async getPing(
    message: Message,
    @CurrentGuildMember() yui?: GuildMember
  ) {
    const ping = yui.client.ws.ping

    const sentMessage = (await message.channel
      .send('**`Pinging... `**')
      .catch(null)) as Message
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp
    const embed = await discordRichEmbedConstructor({
      title: 'Status',
      description: `:revolving_hearts: **: \`${
        timeEnd - timeStart
      }ms\`**\n:heartpulse: **: \`${ping}ms\`**`,
    })

    if (!!sentMessage) sentMessage.edit(embed)
  }

  @ValidateFeaturePermission()
  public async help(message: Message, @CurrentGuildMember() yui?: GuildMember) {
    let commands =
      '**__Music:__**\n`play | p`: add to end\n' +
      '`pnext | pn`: add to next\n' +
      '`skip | next <?range>`: skip a/some song(s)\n' +
      '`leave | bye`: leave the bot\n' +
      '`join | come`: join the bot\n' +
      '`queue | q <?number>`: list out the queue at tab number (default 0)\n' +
      "`np | nowplaying`: currently playing song's info\n" +
      '`loop <?queue>`: loop the song/the queue\n' +
      '`pause`: pause the song\n' +
      '`resume`: resume pause\n' +
      '`shuffle`: shuffle the queue\n' +
      '`clear`: clear queue\n' +
      '`search`: search for a song, pick by index\n' +
      '`autoplay | ap`: auto play a random song from current Youtube channel\n' +
      '`remove <index> <?range>`: remove a/some song(s)\n' +
      '`stop`: clear queue and stop playing\n\n' +
      '**__Ultilities:__**\n' +
      '`admin <kick/ban/mute/unmute/setnickname/addrole/removerole> <@mentions> <?reason>`: admin commands\n' +
      '`tenor`: tenor GIFs, random limit: 5\n' +
      "`ping`: connection's status\n" +
      '`say`: repeat what you say\n\n'

    const embed = await discordRichEmbedConstructor({
      author: {
        embedTitle: yui.user.username,
        authorAvatarUrl: yui.user.avatarURL(),
      },
      description: commands,
      title: 'Command List',
      footer: 'Note: <>: required param | <?>: optional param',
    })

    message.channel.send(embed)
  }

  @ValidateFeaturePermission()
  public async say(
    message: Message,
    args: Array<string>,
    @CurrentGuildMember() yui?: GuildMember
  ): Promise<void> {
    const embed = await discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`,
      author: {
        authorAvatarUrl: message.member.user.avatarURL(),
        embedTitle: message.member.displayName,
      },
    })

    message.channel.send(embed)
  }

  @ValidateFeaturePermission()
  public async tenorGif(
    message: Message,
    args: Array<string>,
    @MentionedUsers() users?: GuildMember[],
    @UserAction() action?: string,
    @RequestParams() params?: string
  ) {
    const num = await RNG(5)
    const result = await tenorRequestService(
      `${action} ${params ? params : ``}`
    ).catch((error) => this.handleError(new Error(error)))

    let mentionString
    if (users?.length) {
      switch (users.length) {
        case 0:
          break
        case 1:
          mentionString = users[0]
          break
        default:
          const last = users.pop()
          mentionString = `${
            users.length > 1 ? users.join(', ') : users[0]
          } and ${last}`
          break
      }
    }

    const description = !users?.length
      ? `${message.member} ${action}`
      : `${message.member} ${action} ${mentionString}`

    message.channel.send(
      await discordRichEmbedConstructor({
        description,
        imageUrl: result.results[num].media[0].gif.url,
      })
    )
  }

  @ValidateFeaturePermission()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @CurrentGuildMember() yui?: GuildMember
  ) {
    let region = args?.length > 0 ? args[0].toLocaleLowerCase() : 'jp'

    if (!['jp', 'jap', 'japan', 'id', 'indo', 'indonesia'].includes(region)) {
      return await message.channel
        .send(
          `**Please enter a valid region! Available regions are: \`'jp', 'id'\`**`
        )
        .catch((err) => this.handleError(new Error(err)))
    } else {
      switch (region) {
        case 'id':
        case 'indo':
        case 'indonesia':
          region = 'id'
          break
        case 'jp':
        case 'jap':
        case 'japan':
        default:
          region = 'jp'
          break
      }
    }

    const waitingMessage = (await message.channel.send(
      ':hourglass_flowing_sand: **_Hold on while i go grab some data!_**'
    )) as Message

    const holoStatData = await HoloStatService.getChannelFeatures(
      region as 'id' | 'jp'
    ).catch((error) => this.handleError(new Error(error)))

    const subscriberCountFormatter = (number: number | string) => {
      number = typeof number === 'string' ? Number(number) : number
      let result: string

      if (number > 0 && number <= 999) result = `${number}`
      else if (number > 999 && number <= 999999)
        result = `${(number / 1000).toFixed(2)}K`
      else if (number > 999999 && number <= 999999999)
        result = `${(number / 1000000).toFixed(2)}M`
      else result = `${number}`

      return result.includes('.00') ? result.replace('.00', '') : result
    }

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
        } members channel status${
          hasPaging ? ` page ${index / limit + 1}` : ``
        }`,
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

  private handleError(error: Error | string): null {
    return errorLogger(error, 'FEATURE_SERVICE')
  }
}
