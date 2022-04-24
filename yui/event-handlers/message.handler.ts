import { Message, TextChannel } from 'discord.js'
import { AdministrationService } from '../services/app-services/administration/administration.service'
import { FeatureService } from '../services/app-services/feature/feature.service'
import { MusicService } from '../services/app-services/music/music.service'
import { YuiLogger } from '@/services/logger/logger.service'
import {
  Args,
  MessageChannel,
  HandleCommand,
  MessageParam,
  Command,
  DeleteOriginalMessage,
  MemberPermissions,
  OnEvent,
  UseInterceptor,
} from '@/ioc-container/decorators'
import { ConfigService } from '@/config-service/config.service'
import { MessageCreateEventInterceptor } from '@/event-handlers/event-interceptors'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(MessageCreateEventInterceptor)
export class MessageCreateEventHandler {
  constructor(
    private musicService: MusicService,
    private featureService: FeatureService,
    private administrationService: AdministrationService,
    private configService: ConfigService
  ) {}

  @HandleCommand('play', 'p')
  public async playMusic(
    t = 'test1',
    t2 = 'test2',
    @Args() args: string[],
    @MessageParam() message: Message
  ) {
    console.log(t, t2)
    return this.musicService.play(message, args, false)
  }

  @HandleCommand('playnext', 'pnext', 'pn')
  public async playNext(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.play(message, args, true)
  }

  @HandleCommand('skip', 'next')
  async skipSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.skipSongs(message, args)
  }

  @HandleCommand('join', 'come')
  async join(@MessageParam() message: Message) {
    return this.musicService.joinVoiceChannel(message)
  }

  @HandleCommand('leave', 'bye')
  async leave(@MessageParam() message: Message) {
    return this.musicService.leaveVoiceChannel(message)
  }

  @HandleCommand('np', 'nowplaying')
  async nowPlaying(@MessageParam() message: Message) {
    return this.musicService.getNowPlayingData(message)
  }

  @HandleCommand('queue', 'q')
  async getQueue(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.printQueue(message, args)
  }

  @HandleCommand('pause')
  async pause(@MessageParam() message: Message) {
    return this.musicService.musicController(message, true)
  }

  @HandleCommand('pause')
  async resume(@MessageParam() message: Message) {
    return this.musicService.musicController(message, true)
  }

  @HandleCommand('stop')
  async stopPlaying(@MessageParam() message: Message) {
    return this.musicService.stopPlaying(message)
  }
  @HandleCommand('loop')
  async loopSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.loopSettings(message, args)
  }

  @HandleCommand('shuffle')
  async shuffle(@MessageParam() message: Message) {
    return this.musicService.shuffleQueue(message)
  }

  @HandleCommand('remove', 'rm')
  async removeSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.removeSongs(message, args)
  }

  @HandleCommand('clear')
  async clearQueue(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.setVolume(message, args)
  }

  @HandleCommand('search', 's')
  async searchSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.searchSong(message, args)
  }

  @HandleCommand('autoplay', 'ap')
  async autoplay(@MessageParam() message: Message) {
    return this.musicService.autoPlay(message)
  }

  @HandleCommand('volume', 'v')
  async volume(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.setVolume(message, args)
  }

  @HandleCommand('say', 'repeat')
  @DeleteOriginalMessage()
  async repeat(@MessageParam() message: Message, @Args() args: string[]) {
    return this.featureService.say(message, args)
  }

  @HandleCommand('ping')
  async ping(@MessageParam() message: Message) {
    return this.featureService.getPing(message)
  }

  @HandleCommand('holostat')
  async getHolostat(@MessageParam() message: Message, @Args() args: string[]) {
    return this.featureService.getHoloStat(message, args)
  }

  @HandleCommand('tenor')
  @DeleteOriginalMessage()
  async sendGif(@MessageParam() message: Message, @Args() args: string[]) {
    return this.featureService.tenorGif(message, args)
  }

  @HandleCommand('admin', 'management')
  @DeleteOriginalMessage()
  @MemberPermissions('KICK_MEMBERS', 'BAN_MEMBERS')
  async managementaction(@MessageParam() message: Message, @Args() args: string[]) {
    return this.administrationService.executeCommand(message, args)
  }

  @HandleCommand('help')
  async sendManual(@MessageParam() message: Message) {
    return this.featureService.help(message)
  }

  @HandleCommand()
  async defaultResponse(@MessageChannel() channel: TextChannel, @Command() command: string) {
    channel.send(
      `I cannot recognize ${command}. How about taking a look at \`${this.configService.prefix}help\` ?`
    )
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
