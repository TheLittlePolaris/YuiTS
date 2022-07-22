import Axios from 'axios'
import { DiscordClient, Injectable } from 'djs-ioc-container'
import { GuildMember, Message, Collection } from 'discord.js'
import { discordRichEmbedConstructor, getMentionString } from '../utilities'

import { VtuberStatService } from './vtuberstats/vtuberstat.service'
import { ConfigService } from '@/config-service/config.service'
import { Feature, Mentions, Action, ActionParam } from './decorators'
import { sendChannelMessage } from '../utilities'
import { HoloDetail, HoloRegion, Holostat } from './decorators'
import { TENOR_QUERY_LIMIT } from './constants'
import { sample } from 'lodash'
import { KnownHoloStatRegions } from './vtuberstats/interfaces'

@Injectable()
export class FeatureService {
  constructor(
    private readonly yui: DiscordClient,
    private readonly vtuberStatService: VtuberStatService,
    private readonly configService: ConfigService
  ) {}

  @Feature()
  async getPing(message: Message): Promise<`OK`> {
    const yuiPing = this.yui.ws.ping
    const sentMessage = await sendChannelMessage(message, '**`Pinging... `**')

    if (!sentMessage) {
      await sendChannelMessage(message, '**Something went wrong, please try again.**')
      return
    }
    const timeStart = message.createdTimestamp
    const timeEnd = sentMessage.createdTimestamp
    const embed = discordRichEmbedConstructor({
      title: 'Status',
      description: `:heartbeat: **Yui's ping: \`${yuiPing}ms\`**.\n:revolving_hearts: **Estimated message RTT: \`${
        timeEnd - timeStart
      }ms\`**`
    })

    // const attachment = new MessageAttachment(image, 'ping.jpg')
    if (sentMessage) sentMessage.delete().catch(null)

    await sendChannelMessage(message, { embeds: [embed] })

    return 'OK'
  }

  @Feature()
  async help(message: Message) {
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

    const yuiMember = this.yui.getGuildMemberByMessage(message)
    const embed = discordRichEmbedConstructor({
      author: {
        authorName: yuiMember.displayName || this.yui.user.username,
        avatarUrl: this.yui.user.avatarURL()
      },
      description: commands,
      title: 'Command List',
      footer: 'Note: <>: required param | <?>: optional param'
    })

    sendChannelMessage(message, { embeds: [embed] })
  }

  @Feature()
  say(message: Message, args: string[]) {
    const embed = discordRichEmbedConstructor({
      description: `**${args.join(' ')}**`
    })
    sendChannelMessage(message, { embeds: [embed] })
  }

  @Feature()
  async tenorGif(
    message: Message,
    args: string[],
    @Mentions() mentions?: Collection<string, GuildMember>,
    @Action() action?: string,
    @ActionParam() params?: string
  ): Promise<void> {
    const results = await this.queryTenorGif(action, params)
    const mentionString = getMentionString(mentions)

    const description = !mentions?.size
      ? `${message.member} ${action}`
      : `${message.member} ${action} ${mentionString}`

    sendChannelMessage(message, {
      embeds: [
        discordRichEmbedConstructor({
          description,
          imageUrl: sample(results)
        })
      ]
    })
  }

  async queryTenorGif(action: string, params?: string) {
    return Axios.get(
      `https://g.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${action} ${params ? params : ``}`
      )}&key=${this.configService.tenorKey}&limit=${TENOR_QUERY_LIMIT}&media_filter=basic&anon_id=${
        this.configService.tenorAnonymousId
      }`
    ).then(({ data }) => data.results?.map((r) => r?.media[0]?.gif?.url))
  }

  @Feature()
  @Holostat()
  async getHoloStat(
    message: Message,
    args: Array<string>,
    @HoloRegion() region?: KnownHoloStatRegions,
    @HoloDetail() detail?: boolean
  ): Promise<unknown> {
    if (!detail)
      return this.vtuberStatService.vtuberStatStatistics({
        message,
        yui: this.yui.getGuildMemberByMessage(message),
        affiliation: 'Hololive',
        region
      })

    return this.vtuberStatService.vtuberStatSelectList({
      message,
      affiliation: 'Hololive',
      regionCode: region
    })
  }
}
