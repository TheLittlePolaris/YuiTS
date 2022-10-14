import { Message, PermissionFlagsBits, TextChannel } from 'discord.js';
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
} from '@tlp01/djs-ioc-container';
import { sample } from 'lodash';

import { MessageCreateInterceptor } from './message.interceptor';

import { YuiLogger } from '@/logger/logger.service';
import { ConfigService } from '@/config-service/config.service';
import { MusicService } from '@/services/music/music.service';
import { AdministrationService } from '@/services/administration/administration.service';
import { FeatureService } from '@/services/feature/feature.service';
import {
  randomNumberGenerator,
  sendChannelMessage,
  discordRichEmbedConstructor,
  bold
} from '@/services/utilities';

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(MessageCreateInterceptor)
export class MessageCreateEventHandler {
  constructor(
    private readonly musicService: MusicService,
    private readonly featureService: FeatureService,
    private readonly administrationService: AdministrationService,
    private readonly configService: ConfigService
  ) {}

  @HandleCommand('play', 'p')
  public async playMusic(@MsgArgs() arguments_: string[], @Msg() message: Message) {
    return this.musicService.play(message, arguments_, false);
  }

  @HandleCommand('playnext', 'pnext', 'pn')
  public async playNext(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.play(message, arguments_, true);
  }

  @HandleCommand('skip', 'next')
  async skipSong(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.skipSongs(message, arguments_);
  }

  @HandleCommand('join', 'come')
  async join(@Msg() message: Message) {
    return this.musicService.joinVoiceChannel(message);
  }

  @HandleCommand('leave', 'bye')
  async leave(@Msg() message: Message) {
    return this.musicService.leaveVoiceChannel(message);
  }

  @HandleCommand('np', 'nowplaying')
  async nowPlaying(@Msg() message: Message) {
    return this.musicService.getNowPlayingData(message);
  }

  @HandleCommand('queue', 'q')
  async getQueue(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.printQueue(message, arguments_);
  }

  @HandleCommand('pause')
  async pause(@Msg() message: Message) {
    return this.musicService.musicController(message, true);
  }

  @HandleCommand('resume')
  async resume(@Msg() message: Message) {
    return this.musicService.musicController(message, false);
  }

  @HandleCommand('stop')
  async stopPlaying(@Msg() message: Message) {
    return this.musicService.stopPlaying(message);
  }
  @HandleCommand('loop')
  async loopSong(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.loopSettings(message, arguments_);
  }

  @HandleCommand('shuffle')
  async shuffle(@Msg() message: Message) {
    return this.musicService.shuffleQueue(message);
  }

  @HandleCommand('remove', 'rm')
  async removeSong(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.removeSongs(message, arguments_);
  }

  @HandleCommand('clear')
  async clearQueue(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.clearQueue(message, arguments_);
  }

  @HandleCommand('search', 's')
  async searchSong(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.searchSong(message, arguments_);
  }

  @HandleCommand('autoplay', 'ap')
  async autoplay(@Msg() message: Message) {
    return this.musicService.autoPlay(message);
  }

  @HandleCommand('volume', 'v')
  async volume(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.musicService.setVolume(message, arguments_);
  }

  @HandleCommand('say', 'repeat')
  // @DeleteOriginalMessage()
  async repeat(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.featureService.say(message, arguments_);
  }

  @HandleCommand('ping')
  async ping(@Msg() message: Message) {
    console.log(
      message,
      '<==== message, <yui/event-handlers/messageCreate/message.handler.ts:130>'
    );

    return this.featureService.getPing(message);
  }

  @HandleCommand('holostat')
  async getHolostat(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.featureService.getHoloStat(message, arguments_);
  }

  @HandleCommand('tenor', 'yui')
  @DeleteMessage()
  async sendGif(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.featureService.tenorGif(message, arguments_);
  }

  @HandleCommand('admin', 'ad')
  @DeleteMessage()
  @Permissions(PermissionFlagsBits.ModerateMembers)
  async managementAction(@Msg() message: Message, @MsgArgs() arguments_: string[]) {
    return this.administrationService.executeAdminAction(message, arguments_);
  }

  @HandleCommand('help')
  async sendManual(@Msg() message: Message) {
    return this.featureService.help(message);
  }

  @HandleCommand('hey')
  async handleHey(@Msg() message: Message) {
    const responses = [
      'What?',
      'Hmm?',
      'Yea?',
      'Hello~!',
      "I'm here.",
      "I'm all ears.",
      'Yaaahoo!',
      'Erm...?',
      'Heyyy!',
      'Hi~!',
      "What's up?"
    ];
    const messageContent = responses.at(randomNumberGenerator(responses.length));
    sendChannelMessage(message, {
      embeds: [discordRichEmbedConstructor({ description: bold(messageContent) })]
    });
  }

  @HandleCommand()
  async defaultResponse(
    @Msg() message: Message,
    @MsgChannel() channel: TextChannel,
    @MsgCmd() command: string
  ) {
    const messageContent = `I cannot recognize the command \`${command}\`. How about taking a look at \`${this.configService.prefix}help\`?`;
    const images = await this.featureService.queryTenorGif('girl shy').catch(() => null);
    sendChannelMessage(message, {
      ...((images && {
        embeds: [
          discordRichEmbedConstructor({ description: messageContent, imageUrl: sample(images) })
        ]
      }) || { content: messageContent })
    });
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name);
    return null;
  }
}
