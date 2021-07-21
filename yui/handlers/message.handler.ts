import { LOG_SCOPE } from '@/constants/constants'

import { Channel, GuildMember, Message, TextChannel } from 'discord.js'
import { OwnerChannelService } from '../services/owner-service/channel.service'
import { AdministrationService } from '../services/app-services/administration/administration.service'
import { FeatureService } from '../services/app-services/feature/feature.service'
import { MusicService } from '../services/app-services/music/music.service'
import { YuiLogger } from '@/log/logger.service'
import {
  Args,
  Author,
  MessageChannel,
  Handle,
  HandleMessage,
  MessageParam,
  Command,
} from '@/ioc-container/decorators/handle.decorator'
import { UseInterceptor } from '@/ioc-container/decorators/interceptor.decorator'
import { MessageInterceptor } from '@/interceptors/message.interceptor'
import { ConfigService } from '@/config-service/config.service'

@Handle('message')
@UseInterceptor(MessageInterceptor)
export class MessageHandler {
  constructor(
    private musicService: MusicService,
    private featureService: FeatureService,
    private administrationService: AdministrationService,
    private ownerChannelService: OwnerChannelService,
    private configService: ConfigService
  ) {
    YuiLogger.info(`Created!`, LOG_SCOPE.MESSAGE_HANDLER)
  }

  @HandleMessage('play', 'p')
  public async playMusic(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.play(message, args, false)
  }

  @HandleMessage('playnext', 'pnext', 'pn')
  public async playNext(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.play(message, args, true)
  }

  @HandleMessage('skip', 'next')
  async skipSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.skipSongs(message, args)
  }

  @HandleMessage('join', 'come')
  async join(@MessageParam() message: Message) {
    return this.musicService.joinVoiceChannel(message)
  }

  @HandleMessage('leave', 'bye')
  async leave(@MessageParam() message: Message) {
    return this.musicService.leaveVoiceChannel(message)
  }

  @HandleMessage('np', 'nowplaying')
  async nowPlaying(@MessageParam() message: Message) {
    return this.musicService.getNowPlayingData(message)
  }

  @HandleMessage('queue', 'q')
  async getQueue(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.printQueue(message, args)
  }

  @HandleMessage('pause')
  async pause(@MessageParam() message: Message) {
    return this.musicService.musicController(message, true)
  }

  @HandleMessage('pause')
  async resume(@MessageParam() message: Message) {
    return this.musicService.musicController(message, true)
  }

  @HandleMessage('stop')
  async stopPlaying(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.stopPlaying(message)
  }
  @HandleMessage('loop')
  async loopSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.loopSettings(message, args)
  }

  @HandleMessage('shuffle')
  async shuffle(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.shuffleQueue(message)
  }

  @HandleMessage('remove', 'rm')
  async removeSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.removeSongs(message, args)
  }

  @HandleMessage('clear')
  async clearQueue(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.setVolume(message, args)
  }

  @HandleMessage('search', 's')
  async searchSong(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.searchSong(message, args)
  }

  @HandleMessage('autoplay', 'ap')
  async autoplay(@MessageParam() message: Message) {
    return this.musicService.autoPlay(message)
  }

  @HandleMessage('volume', 'v')
  async volume(@MessageParam() message: Message, @Args() args: string[]) {
    return this.musicService.setVolume(message, args)
  }

  @HandleMessage('say', 'repeat')
  async repeat(@MessageParam() message: Message, @Args() args: string[]) {
    message
      .delete()
      .catch((err) => message.author.send(`Something went wrong, i couldn't delete the message`))
    return this.featureService.say(message, args)
  }

  @HandleMessage('ping')
  async ping(@MessageParam() message: Message) {
    return this.featureService.getPing(message)
  }

  @HandleMessage('holostat')
  async getHolostat(@MessageParam() message: Message, @Args() args: string[]) {
    return this.featureService.getHoloStat(message, args)
  }

  @HandleMessage('tenor')
  async sendGif(@MessageParam() message: Message, @Args() args: string[]) {
    message.delete().catch((err) => null)
    return this.featureService.tenorGif(message, args)
  }

  @HandleMessage('admin', 'management')
  async managementaction(@MessageParam() message: Message, @Args() args: string[]) {
    message.delete().catch((err) => null)
    return this.administrationService.executeCommand(message, args)
  }

  @HandleMessage('help')
  async sendManual(@MessageParam() message: Message, @Args() args: string[]) {
    return this.featureService.help(message)
  }

  @HandleMessage()
  async defaultResponse(@MessageChannel() channel: TextChannel, @Command() command: string) {
    channel.send(
      `I cannot recognize command \`${command}\`. How about taking a look at \`${this.configService.prefix}help\` ?`
    )
  }


  async specialExecute(message: Message): Promise<void> {
    const content = message.content.trim().split(/ +/g)
    const command = content.shift().toLowerCase()

    switch (command) {
      case 'statistics':
      case 'stat':
        return this.ownerChannelService.statistics(message, content)
    }
  }

  // @HandleMessage('test') // it works
  // public async handleTest(
  //   @MessageParam() message: Message,
  //   @Author() author: GuildMember,
  //   @Args() args: string[]
  // ) {
  //   console.log(message, `<======= message [message.handler.ts - 167]`)
  //   console.log(author, `<======= author [message.handler.ts - 168]`)
  //   console.log(args, `<======= args [message.handler.ts - 169]`)
  // }

  // @HandleMessage('test2')
  // public async handleTest2(
  //   @MessageParam() message: Message,
  //   @Author() author: GuildMember,
  //   @Args() args: string[]
  // ) {
  //   console.log(message, `<======= message [message.handler.ts - 167]`)
  //   console.log(author, `<======= author [message.handler.ts - 168]`)
  //   console.log(args, `<======= args [message.handler.ts - 169]`)
  // }

  handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.MESSAGE_HANDLER)
    return null
  }
}
