import { GuildMember, Message } from 'discord.js';
import { unescape } from 'lodash';
import { Injectable } from '@tlp01/djs-ioc-container';
import { AudioPlayerStatus } from '@discordjs/voice';

import {
  bold,
  code,
  codeBlock,
  deleteMessage,
  discordRichEmbedConstructor,
  italic,
  Markdown,
  sendChannelMessage,
  underline
} from '../utilities';

import { AccessController, GuildStream, YuiMember } from './decorators/access-controller.decorator';
import {
  isSoundCloudPlaylistUrl,
  isSoundCloudSongUrl,
  isSoundCloudUrl
} from './soundcloud-service';
import { createProgressBar, printQueueList, timeConverter } from './utils';
import { isYoutubePlaylistUrl, YoutubeInfoService } from './youtube-service';
import { MusicStreamService } from './stream.service';
import { MusicQueueService } from './queue.service';
import { MusicStream } from './entities';

import { YuiLogger } from '@/logger/logger.service';

@Injectable()
export class MusicService {
  constructor(
    private readonly youtubeInfoService: YoutubeInfoService,
    private readonly streamService: MusicStreamService,
    private readonly queueService: MusicQueueService
  ) {}

  @AccessController(true)
  public async play(
    message: Message,
    arguments_: string[],
    next: boolean,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream || (await this.streamService.createStream(message));
    if (!stream) return;

    const query: string = arguments_.join(' ');

    let type: 'youtube' | 'soundcloud' = 'youtube';
    if (isSoundCloudUrl(query)) {
      if (isSoundCloudPlaylistUrl(query)) {
        await this.streamService.startPlaylist({ message, stream, query, type: 'soundcloud' });
        return;
      } else if (!isSoundCloudSongUrl(query)) {
        sendChannelMessage(message, bold('the provided URL is not recognized as playable source'));
        return;
      }

      type = 'soundcloud';
    }

    if (isYoutubePlaylistUrl(query)) {
      await this.streamService.startPlaylist({ message, stream, query, type: 'youtube' });
      return;
    }

    this.streamService.startStream(message, stream, query, {
      requester: message.member.displayName,
      type,
      next
    });
  }

  @AccessController(true)
  public async joinVoiceChannel(
    message: Message,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    const connection = await this.streamService
      .createStream(message)
      .catch((error) => this.handleError(new Error(error)));
    if (connection) sendChannelMessage(message, ' :loudspeaker: Kawaii **Yui-chan** is here~! xD');
    else {
      try {
        if (stream) this.leaveVoiceChannel(message, true);
      } catch (error) {
        this.handleError(new Error(error));
      }
      sendChannelMessage(message, '**Connection could not be established. Please try again.**');
    }
  }

  skipSongs(message: Message, arguments_: string[], ...otherArguments);
  @AccessController()
  public async skipSongs(
    message: Message,
    arguments_: string[],
    @GuildStream() stream: MusicStream
  ) {
    if (stream.queue.isEmpty)
      return sendChannelMessage(message, '**There is nothing playing at the moment...**');

    const { [0]: firstArgument } = arguments_ || [];
    if (!firstArgument) {
      if (stream.isLooping) stream.set('isLooping', false);

      if (stream.audioPlayer) {
        sendChannelMessage(message, ' :fast_forward: **Skipped!**');
        return stream.audioPlayer.stop(/* force */ true);
      }
    } else {
      const removeLength = +firstArgument;
      if (!Number.isNaN(removeLength)) {
        if (removeLength < 0 || removeLength > stream.queue.length)
          return sendChannelMessage(
            message,
            '**The number you gave is bigger than the current queue!**'
          );

        stream.queue.removeSongs(1, removeLength);

        if (stream.isLooping) stream.set('isLooping', false);

        if (stream.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
          sendChannelMessage(message, ` :fast_forward: **Skipped ${removeLength} songs!**`);
          return stream.audioPlayer.stop(/* force */ true);
        }
      }
    }
  }

  setVolume(message: Message, arguments_: Array<string>, ...otherArguments);
  @AccessController()
  public setVolume(
    message: Message,
    arguments_: Array<string>,
    @GuildStream() stream: MusicStream
  ): void {
    if (!arguments_.length)
      sendChannelMessage(message, '**Please choose a specific volume number!**');

    const newVolume = Number(arguments_.shift());

    if (!Number.isNaN(newVolume) && newVolume < 0 && newVolume > 100)
      sendChannelMessage(message, '**Please choose a valid number! (0 <= volume <= 100)**');

    const currentVolume = stream.audioResource?.volume?.volume || 100;

    stream.audioResource?.volume?.setVolume(newVolume / 100);

    sendChannelMessage(
      message,
      `**Volume ${currentVolume < newVolume ? 'incleased' : 'decreased'} from ${
        currentVolume * 100
      } to ${newVolume}**`
    );
  }

  autoPlay(message: Message, ...arguments_);
  @AccessController(true)
  public async autoPlay(message: Message, @GuildStream() stream: MusicStream): Promise<void> {
    if (!stream) stream = await this.streamService.createStream(message);

    if (!stream?.isAutoPlaying) {
      stream.set('isAutoPlaying', true);
      sendChannelMessage(message, {
        embeds: [
          discordRichEmbedConstructor({
            title: ":infinity: Yui's PABX mode - ON! 🎵",
            description: ''
          })
        ]
      });
      if (stream?.queue?.isEmpty)
        sendChannelMessage(
          message,
          'Ok, now where do we start? How about you add something first? XD'
        );

      return;
    } else {
      stream.set('isAutoPlaying', false);
      sendChannelMessage(message, {
        embeds: [discordRichEmbedConstructor({ title: "Yui's PABX mode - OFF~" })]
      });
      return;
    }
  }

  getNowPlayingData(message: Message, ...otherargs); // override definition
  @AccessController()
  public async getNowPlayingData(
    message: Message,
    @GuildStream() stream: MusicStream,
    @YuiMember() member: GuildMember
  ): Promise<void> {
    if (stream.queue.isEmpty) {
      sendChannelMessage(message, '**Nothing is playing!**');
      return;
    }
    const currentSong = stream.queue.at(0);
    const streamingTime = Math.round((stream?.audioResource?.playbackDuration || 0) / 1000);
    const content = `**\`${timeConverter(streamingTime)}\`𝗹${createProgressBar(
      streamingTime,
      currentSong.duration
    )}𝗹\`${timeConverter(currentSong.duration)}\`**\n__\`Channel\`__: **\`${
      currentSong.channelTitle
    }\`**`;
    const embed = discordRichEmbedConstructor({
      title: currentSong.title,
      author: {
        authorName: '♫ Now Playing ♫',
        avatarUrl: member.user.avatarURL()
      },
      description: content,
      thumbnailUrl: currentSong.videoThumbnail,
      titleUrl: currentSong.videoUrl,
      footer: `Requested by ${currentSong.requester}`
    });
    sendChannelMessage(message, { embeds: [embed] });
  }

  printQueue(message: Message, arguments_: Array<string>, ...otherArguments);
  @AccessController()
  public async printQueue(
    message: Message,
    arguments_: Array<string>,
    @GuildStream() stream: MusicStream
  ) {
    // stream = stream!
    if (stream?.queue?.isEmpty) return sendChannelMessage(message, '**Nothing in queue!**');

    const songsInQueue = stream.queue.length - 1; // exclude now playing
    const limit = 10;
    const tabs = Math.ceil(songsInQueue / limit) || 1;
    const { [0]: firstArgument = '1' } = arguments_ || ['1'];

    const selectedTabNumber = Number.isNaN(+firstArgument) ? 1 : +firstArgument;

    if (selectedTabNumber > tabs)
      return sendChannelMessage(
        message,
        'Index out of range! Please choose a valid one, use `>queue` for checking.'
      );

    if (+firstArgument === 1) {
      const nowPlaying = stream.queue.first;

      const queueHeader = `**__NOW PLAYING:__\n\`🎶\`${
        nowPlaying.title
      }\`🎶\`** - \`(${timeConverter(nowPlaying.duration)})\`\n*Requested by \`${
        nowPlaying.requester
      }\`*\n\n`;

      let queueBody = '';
      const queueList = printQueueList(stream.queue, 1, songsInQueue <= 10 ? songsInQueue : limit);
      const queueLength = this.queueService.getQueueLength(stream);
      if (songsInQueue > 1)
        queueBody += `**__QUEUE LIST:__**\n
          ${queueList}
          ${songsInQueue > 11 ? `\`And another ${songsInQueue - limit - 1} songs.\`` : ''}\n`;

      const queueFooter = `**${stream.name}'s** total queue duration: \`${queueLength}\` -- Tab: \`1/${tabs}\``;

      sendChannelMessage(message, {
        embeds: [
          discordRichEmbedConstructor({
            description: queueHeader + queueBody + queueFooter
          })
        ]
      });
    } else {
      const startPosition = (selectedTabNumber - 1) * limit + 1;
      const endPos = startPosition + limit - 1;
      const endPosition = endPos > songsInQueue ? songsInQueue : endPos;

      const queueList = printQueueList(stream.queue, startPosition, endPosition);

      const queueBody = `${bold(underline('QUEUE LIST:'))}\n${queueList}${bold(
        stream.name
      )}'s total queue duration: ${code(stream.queue.totalDuration)} -- Tab: ${code(
        `${selectedTabNumber}/${tabs}`
      )}`;

      sendChannelMessage(message, {
        embeds: [
          discordRichEmbedConstructor({
            description: queueBody
          })
        ]
      });
    }
  }

  public async removeSongs(message: Message, arguments_: Array<string>, ...otherArguments);
  @AccessController()
  public async removeSongs(
    message: Message,
    arguments_: string[],
    @GuildStream() stream: MusicStream
  ) {
    if (!arguments_.length) {
      sendChannelMessage(message, italic('Please choose certain song(s) from QUEUE to remove.'));
      return;
    }
    const { length, [0]: argument1, [1]: argument2 } = arguments_ || [];
    const firstValue = +argument1;
    if (Number.isNaN(firstValue))
      if (argument1 !== 'last')
        return sendChannelMessage(message, italic('Invailid option! Action aborted.'));
      else if (stream.queue.length === 1) return this.skipSongs(message, arguments_);
      else {
        const removed = stream.queue.removeLast();
        return sendChannelMessage(
          message,
          bold(`${code(removed.title)} has been removed from QUEUE!`)
        );
      }

    const { length: queueLength } = stream.queue;
    if (length === 1) {
      if (firstValue < 0 || firstValue > stream.queue.length)
        return sendChannelMessage(
          message,
          Markdown.bold('Index out of range! Please choose a valid one, use  for checking.')
        );

      if (firstValue === 0) return this.skipSongs(message, arguments_);
      else {
        const { [0]: song } = stream.queue.removeSongs(firstValue) || [];
        return (
          song &&
          sendChannelMessage(message, bold(`${code(song.title)} has been removed from QUEUE!`))
        );
      }
    } else if (length === 2) {
      const secondValue = +argument2;
      if (Number.isNaN(secondValue))
        return sendChannelMessage(message, 'Invailid option! Action aborted.');

      if (firstValue < 0 || firstValue > queueLength || firstValue + secondValue > queueLength)
        return sendChannelMessage(
          message,
          bold(`Index out of range! Please choose a valid one, use ${code('-queue')} for checking.`)
        );

      if (firstValue === 0) return this.skipSongs(message, [`${secondValue}`]);

      stream.queue.removeSongs(firstValue, secondValue);
      return sendChannelMessage(
        message,
        bold(
          `Songs from number ${firstValue} to ${firstValue + secondValue - 1} removed from QUEUE!`
        )
      );
    }
  }

  @AccessController(true)
  public async searchSong(message: Message, arguments_: string[]) {
    const searchQuery = arguments_.join(' ');
    const result = await this.youtubeInfoService.searchByQuery(searchQuery);

    const { items } = result;

    const embed = discordRichEmbedConstructor({
      title: bold(`Pick one option from the list below, or type ${code('cancel')} to abort.`),
      description: bold(
        codeBlock(
          items.map((item, index) => `#${index + 1}\n${unescape(item.snippet.title)}\n\n`).join(''),
          'cpp'
        )
      )
    });

    const sentContent = await sendChannelMessage(message, { embeds: [embed] });
    const collector = message.channel.createMessageCollector({
      filter: (m: Message) =>
        m.author.id === message.author.id && m.channel.id === message.channel.id,
      time: 60000,
      max: 1
    });

    collector.on('collect', async (collected: Message) => {
      collector.stop();
      const content = collected.content.match(/\d{1,2}|\w+/)[0];
      if (content === 'cancel') {
        deleteMessage(sentContent);
        sendChannelMessage(message, bold('Canceled!'));
        return;
      } else {
        const index = +content;
        if (!Number.isNaN(index) && index > 0 && index <= 10) {
          deleteMessage(sentContent);
          const argumentsData = [items[index - 1].id.videoId];
          this.play(message, argumentsData, false);
        } else {
          sendChannelMessage(message, italic('Invailid option! Action aborted.'));
          deleteMessage(sentContent);
        }
      }
    });
    collector.on('end', (collected) => {
      if (sentContent) deleteMessage(sentContent);

      if (collected.size < 1) sendChannelMessage(message, italic('Aborted.'));
    });
  }

  shuffleQueue(message: Message, ...otherArguments);
  @AccessController()
  public shuffleQueue(message: Message, @GuildStream() stream: MusicStream): void {
    if (!stream.queue.isEmpty) {
      stream.queue.shuffle();
      sendChannelMessage(message, `:twisted_rightwards_arrows: ${bold('QUEUE shuffled!')}`);
    } else sendChannelMessage(message, bold("I'm not playing anything!"));
  }

  clearQueue(message: Message, ...otherArguments);
  @AccessController()
  public clearQueue(message: Message, @GuildStream() stream: MusicStream): void {
    if (!stream.queue.isEmpty) {
      stream.queue.clearQueue();
      sendChannelMessage(message, `:x: ${bold('Queue cleared!')}`);
    } else sendChannelMessage(message, bold('Queue is empty!'));
  }

  public loopSettings(message: Message, arguments_: string[], ...otherArguments);
  @AccessController()
  public loopSettings(message: Message, arguments_: string[], @GuildStream() stream: MusicStream) {
    if (!stream) return this.handleError('Undefined stream value');

    const firstArgument = (arguments_.length && arguments_.shift().toLowerCase()) || null;

    if (!firstArgument)
      if (!stream.isLooping) {
        stream.set('isLooping', true);
        sendChannelMessage(message, ' :repeat: _**Loop enabled!**_');
      } else {
        stream.set('isLooping', false);
        sendChannelMessage(message, ' :twisted_rightwards_arrows: _**Loop disabled!**_');
      }
    else if (firstArgument === 'queue')
      if (!stream.isQueueLooping) {
        stream.set('isQueueLooping', true);
        sendChannelMessage(message, ' :repeat: _**Queue loop enabled!**_');
      } else {
        stream.set('isQueueLooping', false);
        sendChannelMessage(message, ' :twisted_rightwards_arrows: _**Queue loop disabled!**_');
      }
    else
      sendChannelMessage(
        message,
        bold(`I'm sorry but what do you mean by ${code(firstArgument)} ?`)
      );
  }

  @AccessController()
  public musicController(
    message: Message,
    isPause: boolean,
    @GuildStream() stream?: MusicStream
  ): void {
    if (!stream) {
      this.handleError(new Error('Undefined stream value'));
      return;
    }
    if (stream.audioPlayer)
      return isPause ? this.streamService.setPause(stream) : this.streamService.setResume(stream);
    else sendChannelMessage(message, "I'm not playing anything.");
  }

  @AccessController()
  public stopPlaying(message: Message, @GuildStream() stream?: MusicStream): void {
    if (stream?.isPlaying) {
      stream.queue.deleteQueue();
      this.streamService.resetStreamStatus(stream);
      sendChannelMessage(message, '**Stopped!**');
    } else sendChannelMessage(message, '**Nothing is playing!**');
  }
  leaveVoiceChannel(message: Message, isError?: boolean, ...arguments_);
  @AccessController()
  public async leaveVoiceChannel(
    message: Message,
    isError = false,
    @GuildStream() stream: MusicStream
  ): Promise<void> {
    if (!stream) return this.handleError('Stream not found!');

    this.streamService.resetStreamStatus(stream);

    stream.voiceConnection.destroy();

    this.streamService.deleteStream(stream);

    if (!isError) sendChannelMessage(message, '**_Bye bye~! Matta nee~!_**');
  }

  public timeoutLeaveChannel(stream: MusicStream) {
    try {
      stream.voiceConnection.destroy();
      stream.textChannel.send(bold(italic("There's no one around so I'll leave too. Bye~!")));
      this.streamService.resetStreamStatus(stream);
      this.streamService.deleteStream(stream);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, MusicService.name);
    return null;
  }
}
