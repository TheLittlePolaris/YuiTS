import { Message, TextChannel } from 'discord.js'
import { YuiLogger } from '@/logger/logger.service'
import {
  MsgArgs,
  MsgChannel,
  HandleCommand,
  Msg,
  MsgCmd,
  DeleteMessage,
  Permissions,
  OnEvent,
  UseInterceptor
} from 'djs-ioc-container'
import { ConfigService } from '@/config-service/config.service'

import { sample } from 'lodash'
import { MusicService } from '@/services/music/music.service'
import { AdministrationService } from '@/services/administration/administration.service'
import { FeatureService } from '@/services/feature/feature.service'
import {
  randomNumberGenerator,
  sendChannelMessage,
  discordRichEmbedConstructor,
  bold
} from '@/services/utilities'
import { MessageCreateInterceptor } from './message.interceptor'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(MessageCreateInterceptor)
export class MessageCreateEventHandler {
  constructor(
    private musicService: MusicService,
    private featureService: FeatureService,
    private administrationService: AdministrationService,
    private configService: ConfigService
  ) {}

  @HandleCommand('play', 'p')
  public async playMusic(@MsgArgs() args: string[], @Msg() message: Message) {
    return this.musicService.play(message, args, false)
  }

  @HandleCommand('playnext', 'pnext', 'pn')
  public async playNext(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.play(message, args, true)
  }

  @HandleCommand('skip', 'next')
  async skipSong(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.skipSongs(message, args)
  }

  @HandleCommand('join', 'come')
  async join(@Msg() message: Message) {
    return this.musicService.joinVoiceChannel(message)
  }

  @HandleCommand('leave', 'bye')
  async leave(@Msg() message: Message) {
    return this.musicService.leaveVoiceChannel(message)
  }

  @HandleCommand('np', 'nowplaying')
  async nowPlaying(@Msg() message: Message) {
    return this.musicService.getNowPlayingData(message)
  }

  @HandleCommand('queue', 'q')
  async getQueue(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.printQueue(message, args)
  }

  @HandleCommand('pause')
  async pause(@Msg() message: Message) {
    return this.musicService.musicController(message, true)
  }

  @HandleCommand('resume')
  async resume(@Msg() message: Message) {
    return this.musicService.musicController(message, false)
  }

  @HandleCommand('stop')
  async stopPlaying(@Msg() message: Message) {
    return this.musicService.stopPlaying(message)
  }
  @HandleCommand('loop')
  async loopSong(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.loopSettings(message, args)
  }

  @HandleCommand('shuffle')
  async shuffle(@Msg() message: Message) {
    return this.musicService.shuffleQueue(message)
  }

  @HandleCommand('remove', 'rm')
  async removeSong(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.removeSongs(message, args)
  }

  @HandleCommand('clear')
  async clearQueue(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.clearQueue(message, args)
  }

  @HandleCommand('search', 's')
  async searchSong(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.searchSong(message, args)
  }

  @HandleCommand('autoplay', 'ap')
  async autoplay(@Msg() message: Message) {
    return this.musicService.autoPlay(message)
  }

  @HandleCommand('volume', 'v')
  async volume(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.musicService.setVolume(message, args)
  }

  @HandleCommand('say', 'repeat')
  // @DeleteOriginalMessage()
  async repeat(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.featureService.say(message, args)
  }

  @HandleCommand('ping')
  async ping(@Msg() message: Message) {
    return this.featureService.getPing(message)
  }

  @HandleCommand('holostat')
  async getHolostat(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.featureService.getHoloStat(message, args)
  }

  @HandleCommand('tenor', 'yui')
  @DeleteMessage()
  async sendGif(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.featureService.tenorGif(message, args)
  }

  @HandleCommand('admin', 'ad')
  @DeleteMessage()
  @Permissions('MODERATE_MEMBERS')
  async managementAction(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.administrationService.executeAdminAction(message, args)
  }

  @HandleCommand('help')
  async sendManual(@Msg() message: Message) {
    return this.featureService.help(message)
  }

  @HandleCommand('hey')
  async handleHey(@Msg() message: Message) {
    const responses = [
      'What?',
      'Hmm?',
      `Yea?`,
      `Hello~!`,
      `I'm here.`,
      `I'm all ears.`,
      `Yaaahoo!`,
      `Erm...?`,
      `Heyyy!`,
      `Hi~!`,
      `What's up?`
    ]
    const messageContent = responses.at(randomNumberGenerator(responses.length))
    sendChannelMessage(message, {
      embeds: [discordRichEmbedConstructor({ description: bold(messageContent) })]
    })
  }

  @HandleCommand()
  async defaultResponse(
    @Msg() message: Message,
    @MsgChannel() channel: TextChannel,
    @MsgCmd() command: string
  ) {
    const messageContent = `I cannot recognize the command \`${command}\`. How about taking a look at \`${this.configService.prefix}help\`?`
    const images = await this.featureService.queryTenorGif('girl shy').catch(() => null)
    sendChannelMessage(message, {
      ...((images && {
        embeds: [
          discordRichEmbedConstructor({ description: messageContent, imageUrl: sample(images) })
        ]
      }) || { content: messageContent })
    })
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
