import { LOG_SCOPE } from '@/constants/constants'
import {
  Detail,
  HoloStatCommandValidator,
  Region,
} from '@/decorators/feature-holostat.decorator'
import {
  CurrentGuildMember,
  FeaturePermissionValidator,
  FeatureServiceInitiator,
  MentionedUsers,
  RequestParams,
  UserAction,
} from '@/decorators/features.decorator'
import { debugLogger, errorLogger } from '@/handlers/log.handler'
import {
  GuildMember,
  Message,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { discordRichEmbedConstructor } from '../utilities/discord-embed-constructor'
import { RNG } from '../utilities/util-function'
import {
  pingImageGenerator,
  tenorRequestService,
} from './feature-services/feature-utilities'
import { HoloStatService } from './holostat-service/holostat.service'

@FeatureServiceInitiator()
export class FeatureService {
  private _holoStatService: HoloStatService
  constructor() {
    debugLogger('FeatureService')
  }

  @FeaturePermissionValidator()
  public async getPing(
    message: Message,
    @CurrentGuildMember() yui?: GuildMember
  ) {
    const yuiPing = yui.client.ws.ping
    const sentMessage = await this.sendMessage(message, '**`Pinging... `**')

    if (!sentMessage)
      return this.sendMessage(
        message,
        '**Something went wrong, please try again.**'
      )
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp

    const image: Buffer = await pingImageGenerator(
      yuiPing,
      timeEnd - timeStart
    ).catch((err) => this.handleError(new Error(err)))
    // const embed = await discordRichEmbedConstructor({
    //   title: 'Status',
    //   description: `:heartbeat: **Yui's ping: \`${yuiPing}ms\`**.\n:revolving_hearts: **Estimated message RTT: \`${
    //     timeEnd - timeStart
    //   }ms\`**`,
    // })

    const attachment = new MessageAttachment(image, 'ping.jpg')
    if (!!sentMessage) sentMessage.delete().catch(null)

    this.sendMessage(message, attachment)
  }

  @FeaturePermissionValidator()
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
      '`volume`: Adjust stream volume' +
      '`shuffle`: shuffle the queue\n' +
      '`clear`: clear queue\n' +
      '`search`: search for a song, pick by index\n' +
      '`autoplay | ap`: auto play a random song from current Youtube channel\n' +
      '`remove <index> <?range>`: remove a/some song(s)\n' +
      '`stop`: clear queue and stop playing\n\n' +
      '**__Ultilities:__**\n' +
      '`admin <kick/ban/mute/unmute/setnickname/addrole/removerole> <?@roles> <@mentions> <?reason>`: admin commands\n' +
      '`tenor`: tenor GIFs, random limit: 5\n' +
      "`ping`: connection's status\n" +
      '`say`: repeat what you say\n\n' +
      '`holostat` <?jp|id> <?detail>: Hololive member status'

    const embed = await discordRichEmbedConstructor({
      author: {
        authorName: yui.user.username,
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

    this.sendMessage(
      message,
      await discordRichEmbedConstructor({
        description,
        imageUrl: result.results[num].media[0].gif.url,
      })
    )
  }

  @FeaturePermissionValidator()
  @HoloStatCommandValidator()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @CurrentGuildMember() yui?: GuildMember,
    @Region() region?: 'jp' | 'id',
    @Detail() detail?: boolean
  ) {
    if (!detail)
      return this._holoStatService.holoStatStatistics(message, yui, region)

    return this._holoStatService.holoStatSelectList(message, region)
  }

  private async sendMessage(
    message: Message,
    content: string | MessageEmbed | MessageOptions | MessageAttachment
  ): Promise<Message> {
    return await message.channel
      .send(content)
      .catch((error) => this.handleError(new Error(error)))
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.FEATURE_SERVICE)
  }
}
