import { Message, TextChannel } from 'discord.js'
import { AdministrationService } from '../../services/app-services/administration/administration.service'
import { FeatureService } from '../../services/app-services/feature/feature.service'
import { MusicService } from '../../services/app-services/music/music.service'
import { YuiLogger } from '@/services/logger/logger.service'
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
} from '@/ioc-container/decorators'
import { ConfigService } from '@/config-service/config.service'
import { MessageCreateInterceptor } from '@/event-handlers/event-interceptors'
import { discordRichEmbedConstructor, sendChannelMessage } from '@/services/app-services/utilities'
import { sample } from 'lodash'

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

  @HandleCommand('pause')
  async resume(@Msg() message: Message) {
    return this.musicService.musicController(message, true)
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
    return this.musicService.setVolume(message, args)
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

  @HandleCommand('tenor')
  @DeleteMessage()
  async sendGif(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.featureService.tenorGif(message, args)
  }

  @HandleCommand('admin', 'ad')
  @DeleteMessage()
  @Permissions('MODERATE_MEMBERS')
  async managementaction(@Msg() message: Message, @MsgArgs() args: string[]) {
    return this.administrationService.executeCommand(message, args)
  }

  @HandleCommand('help')
  async sendManual(@Msg() message: Message) {
    return this.featureService.help(message)
  }

  @HandleCommand()
  async defaultResponse(@Msg() message: Message, @MsgChannel() channel: TextChannel, @MsgCmd() command: string) {
    const messageContent = `I cannot recognize the command \`${command}\`. How about taking a look at \`${this.configService.prefix}help\`?`
    const images = await this.featureService.queryTenorGif('girl shy').catch(() => null)
    sendChannelMessage(message, {
      ...((images && {
        embeds: [discordRichEmbedConstructor({ description: messageContent, imageUrl: sample(images) })]
      }) || { content: messageContent })
    })
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
