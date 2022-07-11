import { AppConfig } from '@/constants'
import { Injectable } from '@/ioc-container'
import { YuiLogger } from '@/services/logger'
import { AudioPlayerStatus, StreamType } from '@discordjs/voice'
import { Message, VoiceChannel, TextChannel } from 'discord.js'
import { Readable, PassThrough } from 'stream'
import ytdl from 'ytdl-core'
import {
  sendChannelMessage,
  deleteMessage,
  discordRichEmbedConstructor,
  editMessage,
  bold,
  italic,
  code
} from '../utilities'
import { MusicConnectionService } from './connection.service'
import { MusicStream, getStream, addStream, deleteStream } from './entities'
import { ISong, ISongOption } from './interfaces'
import { MusicQueueService } from './queue.service'
import { PolarisSoundCloudPlayer } from './soundcloud-service'
import { timeConverter } from './utils'

@Injectable()
export class MusicStreamService {
  constructor(
    private readonly connectionService: MusicConnectionService,
    private readonly soundcloudPlayer: PolarisSoundCloudPlayer,
    private readonly queueService: MusicQueueService
  ) {}

  async createStream(message: Message): Promise<MusicStream | null> {
    const sentMessage = await sendChannelMessage(
      message,
      `:hourglass_flowing_sand: ${bold(italic('Preparing, just one moment!'))}`
    )

    const { guild, channel: textChannel, member } = message
    const voiceChannel = member.voice?.channel
    const existingStream = getStream(guild.id)

    if (existingStream) return existingStream

    const voiceConnection = await this.connectionService.createVoiceConnection(message)
    if (!voiceConnection) throw new Error('Could not create voice connection')

    const stream = new MusicStream(
      guild,
      voiceChannel as VoiceChannel,
      textChannel as TextChannel,
      voiceConnection
    )
    addStream(guild.id, stream)

    this.connectionService.registerConnectionListener(voiceConnection, {
      error: (error: Error) => {
        this.handleError(error)
        if (stream?.isPlaying) {
          this.resetStreamStatus(stream)
        }
        sendChannelMessage(message, `**Connection lost...**`)
      }
    })

    sendChannelMessage(
      message,
      bold(
        `Connected to Channel ${textChannel.toString()} and Voice Channel ${voiceChannel.toString()}!`
      )
    )

    deleteMessage(sentMessage)
    return stream
  }

  async startStream(message: Message, stream: MusicStream, query: string, options: ISongOption) {
    const song = await this.queueService.enqueueSongFromQuery(stream, query, options)

    const sendInfoToChannel = (status: string) => {
      const nowPlayingDescription = `${italic(code('Channel'))}: ${bold(
        code(song.channelTitle)
      )}\n${italic(code('Duration'))}: ${bold(code(timeConverter(song.duration)))}${
        stream.queue.length === 1
          ? ``
          : `\n${italic(code('Position in queue'))}:${bold(code(stream.queue.length - 1))}`
      }`

      const embed = discordRichEmbedConstructor({
        title: song.title,
        author: {
          authorName: status,
          avatarUrl: message.author.avatarURL()
        },
        description: nowPlayingDescription,
        color: AppConfig.YUI_COLOR_CODE,
        thumbnailUrl: song.videoThumbnail,
        appendTimeStamp: true,
        titleUrl: song.videoUrl,
        footer: `Requested by ${song.requester}`
      })

      sendChannelMessage(message, { embeds: [embed] })
    }

    if (!stream.isPlaying) {
      stream.set('isPlaying', true)
      await this.playMusicOnStream(stream)
      sendInfoToChannel('♫ Now Playing ♫')
    } else {
      sendInfoToChannel('♬ Added To QUEUE ♬')
    }
  }

  public resetStreamStatus(stream: MusicStream): void {
    if (!stream) return
    stream.reset()
  }

  private onSongEnd(stream: MusicStream, audioStream?: Readable | PassThrough) {
    if (audioStream && !audioStream.destroyed) audioStream.destroy()

    if (stream.isLooping) return this.playMusicOnStream(stream)

    const { queue, isAutoPlaying, isQueueLooping } = stream

    const endedSong = queue.removeFirst()

    if (isQueueLooping) queue.addSong(endedSong)

    if (!queue.isEmpty) return this.playMusicOnStream(stream)

    if (isAutoPlaying) return this.autoPlaySong(stream, endedSong)

    return this.resetStreamStatus(stream)
  }

  private async sendNowPlaying(stream: MusicStream) {
    return stream.sendMessage({
      embeds: [
        discordRichEmbedConstructor({
          title: `${!stream.isAutoPlaying ? '🎧  Now Playing' : ':infinity: Autoplaying'}: ${
            stream.queue.first.title
          }`,
          description: ''
        })
      ]
    })
  }

  private async getReadableSource(song: ISong) {
    const { id, type, videoUrl = `https://www.youtube.com/watch?v=${id}` } = song

    const downloadOptions: ytdl.downloadOptions = {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 24, // 65536
      liveBuffer: 1 << 15 // 32678
    }

    const audioStream =
      type === 'youtube'
        ? ytdl(videoUrl, downloadOptions)
        : await this.soundcloudPlayer.createMusicStream(videoUrl, downloadOptions)

    if (!audioStream) throw new Error('Stream not created.')

    return { audioStream, videoUrl }
  }

  async playMusicOnStream(stream: MusicStream): Promise<void> {
    let sentMsg: Message
    try {
      const readable = await this.getReadableSource(stream.queue.first)

      stream
        .playAudio(readable.audioStream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
          metadata: { url: readable.videoUrl }
        })
        .once(AudioPlayerStatus.Playing, async () => {
          if (stream.isLooping) return
          sentMsg = await this.sendNowPlaying(stream)
        })
        .once(AudioPlayerStatus.Idle, () => {
          if (sentMsg) deleteMessage(sentMsg)
          this.onSongEnd(stream, readable.audioStream)
        })
    } catch (error) {
      if (sentMsg) deleteMessage(sentMsg)
      this.onSongEnd(stream)
    }
  }

  async autoPlaySong(stream: MusicStream, endedSong: ISong) {
    if (endedSong.type === 'soundcloud') {
      stream.sendMessage(
        bold(
          'Autoplay mode is currently only available with Youtube videos, please add a youtube video.'
        )
      )
      return
    }

    if (!stream.autoplayVideoId || !stream.hasAutoplay) {
      if (!stream.nextPage) stream.set('autoplayVideoId', endedSong.id)

      await this.queueService.loadAutoplayQueue(stream)
    }

    stream.enqueueFromAutoplayQueue()

    this.playMusicOnStream(stream)
  }

  async startPlaylist({
    message,
    stream,
    query,
    type
  }: {
    message: Message
    stream: MusicStream
    query: string
    type: 'youtube' | 'soundcloud'
  }) {
    const { sentMessage, data } = await (type === 'youtube'
      ? this.queueService.getYoutubePlaylist(message, query)
      : this.queueService.getSoundCloudPlaylist(message, query))

    this.queueService.enqueueVideos(stream, data, {
      requester: message.member.displayName,
      type
    })

    editMessage(sentMessage, bold(`:white_check_mark: Enqueued ${data.length} songs!`))

    if (!stream.isPlaying) {
      stream.set('isPlaying', true)

      this.playMusicOnStream(stream)

      sendChannelMessage(message, '**`🎶 Playlist starting - NOW! 🎶`**')
    }
  }

  setPause(stream: MusicStream) {
    if (!stream.isPaused) {
      stream.audioPlayer.pause(true)
      stream.set('isPaused', true)
      stream.sendMessage(':pause_button: **Paused!**')
    } else {
      stream.sendMessage('*Currently paused!*')
    }
  }

  setResume(stream: MusicStream) {
    if (stream.isPaused) {
      stream.audioPlayer.unpause()
      stream.sendMessage(` :arrow_forward: ${bold('Continue playing~!')}`)
    } else {
      stream.sendMessage(bold('Currently playing.'))
    }
  }

  public deleteStream(stream: MusicStream): void {
    stream.set('voiceChannel', null)
    stream.set('textChannel', null)
    deleteStream(stream.id)
  }

  private handleError(error: any) {
    YuiLogger.error(error, this.constructor.name)
  }
}

