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
  subscriberCountFormatter,
} from './feature-services/utility.service'
import { RNG } from '../music/music-utilities/music-function'
import {
  FeatureServiceInitiator,
  CurrentGuildMember,
  FeaturePermissionValidator,
  MentionedUsers,
  UserAction,
  RequestParams,
} from '@/decorators/features.decorator'
import { AdminPermissionValidator } from '@/decorators/permission.decorator'
import { HoloStatRequestService } from './feature-services/holo-stat/holo-stat-request.service'
import { Constants, HOLOSTAT_REGION } from '@/constants/constants'
import {
  HoloStatCommandValidator,
  Region,
  Detail,
} from '@/decorators/feature-holostat.decorator'
import { HoloStatService } from './feature-services/holo-stat/holo-stat.service'

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
        embedTitle: yui.user.username,
        authorAvatarUrl: yui.user.avatarURL(),
      },
      description: commands,
      title: 'Command List',
      footer: 'Note: <>: required param | <?>: optional param',
    })

    message.channel.send(embed)
  }

  @FeaturePermissionValidator()
  public async say(
    message: Message,
    args: Array<string>,
    @CurrentGuildMember() yui?: GuildMember
  ): Promise<void> {
    const embed = await discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`,
    })

    message.channel.send(embed)
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

    message.channel.send(
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
    if (region && !detail)
      return this._holoStatService.holoStatStatistics(message, region, yui)

    if (detail) return this._holoStatService.holoStatSelectList(message, region)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, 'FEATURE_SERVICE')
  }
}
