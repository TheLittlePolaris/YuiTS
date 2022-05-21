import Axios from 'axios'
import { DiscordClient, Injectable } from '@/ioc-container'
import { GuildMember, Message, MessagePayload, MessageOptions } from 'discord.js'
import { discordRichEmbedConstructor, RNG } from '../utilities'

import { VtuberStatService } from './vtuberstat-service/vtuberstat.service'
import { YuiLogger } from '@/services/logger/logger.service'
import { ConfigService } from '@/config-service/config.service'
import { HOLO_KNOWN_REGION } from './vtuberstat-service/holostat-service/holostat.interface'
import { GetParam, Feature, FeatureNew } from '@/custom/decorators/feature-permisson.decorator'
import { NewHolostat, VTuberParam } from '@/custom/decorators/feature-vtuber.decorator'
import { TestDecorator } from '@/custom/decorators/test.decorator'

@Injectable()
export class FeatureService {
  constructor(
    public yui: DiscordClient,
    private vtuberStatService: VtuberStatService,
    private configService: ConfigService
  ) {}

  @Feature()
  public async getPing(message: Message): Promise<`OK`> {
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

    this.sendMessage(message, { embeds: [embed] })

    return 'OK'
  }

  public async help(message: Message, ..._args: any[])
  // @FeaturePermissionValidator()
  @Feature()
  public async help(message: Message, @GetParam('GUILD_MEMBER') yui: GuildMember) {
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

    this.sendMessage(message, { embeds: [embed] })
  }

  // @FeaturePermissionValidator()
  @TestDecorator()
  @FeatureNew()
  public say(message: Message, args: string[]) {
    const embed = discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`,
    })
    this.sendMessage(message, { embeds: [embed] })
  }

  public async tenorGif(message: Message, args: string[], ..._args: any[])
  @Feature()
  // @FeaturePermissionValidator()
  public async tenorGif(
    message: Message,
    args: string[],
    @GetParam('MENTIONS') users: GuildMember[],
    @GetParam('ACTION') action: string,
    @GetParam('REQUEST_PARAM') params: string
  ): Promise<void> {
    const num = await RNG(5)

    const { data = null } = await Axios.get(
      `https://g.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${action} ${params ? params : ``}`
      )}&key=${this.configService.tenorKey}&limit=5&media_filter=basic&anon_id=${
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

    this.sendMessage(message, {
      embeds: [
        discordRichEmbedConstructor({
          description,
          imageUrl: results[num]?.media[0]?.gif?.url,
        }),
      ],
    })
  }
  async getHoloStat(message: Message, args: string[], ..._args: any[])
  @Feature()
  @NewHolostat()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @GetParam('GUILD_MEMBER') yui: GuildMember,
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

  private async sendMessage(
    message: Message,
    content: string | MessagePayload | MessageOptions
  ): Promise<Message> {
    return (await message.channel
      .send(content as any)
      .catch((err) => YuiLogger.error(err))) as Message
  }
}
