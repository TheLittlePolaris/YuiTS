import Queue from 'bull'
import Axios from 'axios'
import { LOG_SCOPE } from '@/constants/constants'
import {
  FeaturePermissionValidator,
  FeatureParam,
} from '@/ioc-container/decorators/feature-permisson.decorator'
import { GuildMember, Message } from 'discord.js'
import { discordRichEmbedConstructor } from '../utilities/discord-embed-constructor'
import { RNG } from '../utilities/util-function'
import { VtuberStatService } from './vtuberstat-service/vtuberstat.service'
import { YuiLogger } from '@/services/logger/logger.service'
import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { YuiClient } from '@/custom-classes/yui-client'
import { ConfigService } from '@/config-service/config.service'
import { HoloStatCommandValidator, VTuberParam } from '@/ioc-container/decorators'
import { HOLO_KNOWN_REGION } from './vtuberstat-service/holostat-service/holostat.interface'
@Injectable()
export class FeatureService {
  queue = new Queue('test')

  constructor(
    public yui: YuiClient,
    private vtuberStatService: VtuberStatService,
    private configService: ConfigService
  ) {
    YuiLogger.info(`Created!`, LOG_SCOPE.FEATURE_SERVICE)

  }

  @FeaturePermissionValidator()
  public async getPing(message: Message): Promise<void> {
    const yuiPing = this.yui.ws.ping
    const sentMessage = await this.sendMessage(message, '**`Pinging... `**')

    if (!sentMessage) {
      this.sendMessage(message, '**Something went wrong, please try again.**')
      return
    }
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp
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

  public async help(message: Message, ..._args: any[])
  @FeaturePermissionValidator()
  public async help(message: Message, @FeatureParam('GUILD_MEMBER') yui: GuildMember) {
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

    const embed = discordRichEmbedConstructor({
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
  public say(message: Message, args: string[]) {
    const embed = discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`,
    })
    this.sendMessage(message, embed)
  }

  public async tenorGif(message: Message, args: string[], ..._args: any[])
  @FeaturePermissionValidator()
  public async tenorGif(
    message: Message,
    args: string[],
    @FeatureParam('MENTIONS') users: GuildMember[],
    @FeatureParam('ACTION') action: string,
    @FeatureParam('REQUEST_PARAM') params: string
  ): Promise<void> {
    const num = await RNG(5)

    const { data = null } = await Axios.get(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${action} ${params ? params : ``}`
      )}&key=${this.configService.tenorKey}&limit=10&media_filter=basic&anon_id=${
        this.configService.tenorAnonymousId
      }`
    )

    const { results = [] } = data || {}

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
      discordRichEmbedConstructor({
        description,
        imageUrl: results[num]?.media[0]?.gif?.url,
      })
    )
  }
  async getHoloStat(message: Message, args: string[], ..._args: any[])
  @FeaturePermissionValidator()
  @HoloStatCommandValidator()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @FeatureParam('GUILD_MEMBER') yui: GuildMember,
    @VTuberParam('REGION') region: HOLO_KNOWN_REGION,
    @VTuberParam('DETAIL') detail: boolean
  ): Promise<unknown> {
    if (!detail)
      return this.vtuberStatService.vtuberStatStatistics({
        message,
        yui,
        affiliation: 'Hololive',
        region,
      })

    return this.vtuberStatService.vtuberStatSelectList({
      message,
      affiliation: 'Hololive',
      regionCode: region,
    })
  }

  private async sendMessage(message: Message, content: any): Promise<Message> {
    return await message.channel.send(content)
  }
}
