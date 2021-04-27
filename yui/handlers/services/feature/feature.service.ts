import { LOG_SCOPE } from '@/constants/constants'
import {
  // Detail,
  HoloStatCommandValidator,
  // Region,
  NijiStatCommandValidator,
  VTuberParam,
} from '@/decorators/feature-vtuber.decorator'
import {
  // CurrentGuildMember,
  FeaturePermissionValidator,
  FeatureServiceInitiator,
  FeatureParam,
  // MentionedUsers,
  // RequestParams,
  // UserAction,
} from '@/decorators/feature-permisson.decorator'
import { GuildMember, Message, MessageAttachment, MessageEmbed, MessageOptions } from 'discord.js'
import { discordRichEmbedConstructor } from '../utilities/discord-embed-constructor'
import { RNG } from '../utilities/util-function'
import { tenorRequestService } from './feature-services/feature-utilities'
import { VtuberStatService } from './vtuberstat-service/vtuberstat.service'
import { HOLO_KNOWN_REGION } from './vtuberstat-service/holostat-service/holostat.interface'
import { NIJI_KNOWN_REGION } from './vtuberstat-service/nijistat-service/nijistat.interface'
import { YuiLogger } from '@/log/logger.service'
import { YuiClient } from '@/yui-client'
import { Injectable } from '@/dep-injection-ioc/decorators'

@Injectable()
export class FeatureService {
  constructor(private _vtuberStatService: VtuberStatService, public yui: YuiClient) {
    YuiLogger.debug(`Created!`, LOG_SCOPE.FEATURE_SERVICE)
  }

  @FeaturePermissionValidator()
  public async getPing(
    message: Message,
    @FeatureParam('GUILD_MEMBER') yui?: GuildMember
  ): Promise<void> {
    const yuiPing = this.yui.ws.ping
    const sentMessage = await this.sendMessage(message, '**`Pinging... `**')

    if (!sentMessage) {
      this.sendMessage(message, '**Something went wrong, please try again.**')
      return
    }
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp

    // const image: Buffer = await pingImageGenerator(
    //   yuiPing,
    //   timeEnd - timeStart
    // ).catch((err) => this.handleError(new Error(err)))
    const embed = await discordRichEmbedConstructor({
      title: 'Status',
      description: `:heartbeat: **Yui's ping: \`${yuiPing}ms\`**.\n:revolving_hearts: **Estimated message RTT: \`${
        timeEnd - timeStart
      }ms\`**`,
    })

    // const attachment = new MessageAttachment(image, 'ping.jpg')
    if (sentMessage) sentMessage.delete().catch(null)

    this.sendMessage(message, embed)
  }

  @FeaturePermissionValidator()
  public async help(
    message: Message,
    @FeatureParam('GUILD_MEMBER') yui?: GuildMember
  ): Promise<void> {
    const commands = `**__Music:__**
    \`play, p\`: Add to end
    \`playnext, pnext, pn\`: Add to next
    \`skip, next <?range>\`: Skip a/some song(s)
    \`leave, bye\`: Leave the bot
    \`join, come\`: Join the bot
    \`queue, q <?number>\`: Print queue
    \`np, nowplaying\`: Currently playing song's info
    \`loop <?queue>\`: Loop the song/the queue
    \`pause\`: Pause the song
    \`resume\`: Resume pause
    \`volume\`: Adjust stream volume
    \`shuffle\`: Shuffle queue
    \`clear\`: Clear queue
    \`search\`: search song
    \`autoplay, ap\`: auto play random song from Youtube channel
    \`remove <index> <?range>\`: remove a/some song(s)
    \`stop\`: Clear queue, stop playing

    **__Ultilities:__**
    \`admin <kick/ban/mute/unmute/setnickname/addrole/removerole> <?role(s)> <@mention(s)> <?reason>\`: Admin commands
    \`tenor\`: tenor GIFs
    \`ping\`: Connection status
    \`say\`: Repeat
    \`holostat\` <?jp|id> <?detail|d>: Hololive member(s) channel status`

    const embed = await discordRichEmbedConstructor({
      author: {
        authorName: yui.displayName || yui.user.username,
        avatarUrl: yui.user.avatarURL(),
      },
      description: commands,
      title: 'Command List',
      footer: 'Note: <>: required param | <?>: optional param',
    })

    this.sendMessage(message, embed)
  }

  @FeaturePermissionValidator()
  public async say(message: Message, args: Array<string>): Promise<void> {
    const embed = await discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`,
    })
    this.sendMessage(message, embed)
  }

  @FeaturePermissionValidator()
  public async tenorGif(
    message: Message,
    args: Array<string>,
    @FeatureParam('MENTIONS') users?: GuildMember[],
    @FeatureParam('ACTION') action?: string,
    @FeatureParam('REQUEST_PARAM') params?: string
  ): Promise<void> {
    const num = await RNG(5)
    const result = await tenorRequestService(`${action} ${params ? params : ``}`).catch((error) =>
      this.handleError(new Error(error))
    )

    let mentionString
    if (users?.length) {
      switch (users.length) {
        case 0:
          break
        case 1:
          mentionString = users[0]
          break
        default:
          {
            const last = users.pop()
            mentionString = `${users.length > 1 ? users.join(', ') : users[0]} and ${last}`
          }
          break
      }
    }

    const description = !users?.length
      ? `${message.member} ${action}`
      : `${message.member} ${action} ${mentionString}`

    this.sendMessage(
      message,
      await discordRichEmbedConstructor({
        description,
        imageUrl: result?.results[num]?.media[0]?.gif?.url,
      })
    )
  }

  @FeaturePermissionValidator()
  @HoloStatCommandValidator()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @FeatureParam('GUILD_MEMBER') yui?: GuildMember,
    @VTuberParam('REGION') region?: HOLO_KNOWN_REGION,
    @VTuberParam('DETAIL') detail?: boolean
  ): Promise<unknown> {
    if (!detail)
      return this._vtuberStatService.vtuberStatStatistics({
        message,
        yui,
        affiliation: 'Hololive',
        region,
      })

    return this._vtuberStatService.vtuberStatSelectList({
      message,
      affiliation: 'Hololive',
      regionCode: region,
    })
  }

  @FeaturePermissionValidator()
  @NijiStatCommandValidator()
  async getNijiStat(
    message: Message,
    args: Array<string>,
    @FeatureParam('GUILD_MEMBER') yui?: GuildMember,
    @VTuberParam('REGION') region?: NIJI_KNOWN_REGION,
    @VTuberParam('DETAIL') detail?: boolean
  ): Promise<unknown> {
    if (!detail)
      return this._vtuberStatService.vtuberStatStatistics({
        message,
        yui,
        affiliation: 'Nijisanji',
        region,
      })

    return this._vtuberStatService.vtuberStatSelectList({
      message,
      affiliation: 'Nijisanji',
      regionCode: region,
    })
  }

  private async sendMessage(
    message: Message,
    content: any
  ): Promise<Message> {
    return await message.channel.send(content).catch((error) => this.handleError(new Error(error)))
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.FEATURE_SERVICE)
    return null
  }
}
