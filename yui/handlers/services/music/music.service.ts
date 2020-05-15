// import discordYtdl from 'ytdl-core-discord'
import { Constants, LOG_SCOPE } from '@/constants/constants'
import {
  AccessController,
  CurrentGuildMember,
  GuildStream,
  MusicServiceInitiator,
} from '@/decorators/music.decorator'
import { debugLogger, errorLogger } from '@/handlers/log.handler'
import { IVoiceConnection } from '@/interfaces/custom-interfaces.interface'
import {
  Client,
  GuildMember,
  Message,
  MessageCollectorOptions,
  MessageEmbed,
  StreamDispatcher,
  StreamOptions,
  TextChannel,
} from 'discord.js'
import { Readable } from 'stream'
import ytdl from 'ytdl-core'
import { discordRichEmbedConstructor } from '../utilities/discord-embed-constructor'
import { RNG } from '../utilities/util-function'
import { MusicQueue } from './music-entities/music-queue'
import { MusicStream } from './music-entities/music-stream'
import { ISong } from './music-interfaces/song-metadata.interface'
import { IYoutubeVideo } from './music-interfaces/youtube-info.interface'
import { SoundCloudService } from './soundcloud-service/soundcloud-info.service'
import {
  isSoundCloudPlaylistUrl,
  isSoundCloudSongUrl,
  isSoundCloudUrl,
} from './soundcloud-service/soundcloud-utilities'
import { YoutubeInfoService } from './youtube-service/youtube-info.service'
import {
  createProgressBar,
  isYoutubePlaylistUrl,
  isYoutubeUrl,
  printQueueList,
  STREAM_STATUS,
  timeConverter,
  youtubeTimeConverter,
} from './youtube-service/youtube-utilities'
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service'

@MusicServiceInitiator()
export class MusicService {
  _streams: Map<string, MusicStream>
  constructor() {
    debugLogger('MusicService')
  }

  private async createStream(
    message: Message,
    client: Client
  ): Promise<MusicStream | null> {
    const sentMessage: Message = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Preparing, just one moment! ;)_**'
    )
    return new Promise(async (resolve, reject) => {
      const { guild, channel, member } = message

      const voiceChannel = member?.voice?.channel

      if (!guild || !channel || !voiceChannel)
        reject(new Error('Please join a voice channel and try again.'))

      const existingStream = this._streams.get(guild.id)

      if (!!existingStream) return resolve(existingStream)
      const stream = new MusicStream(
        guild,
        voiceChannel,
        channel as TextChannel
      )
      const connection = (await this.createVoiceConnection(
        message,
        stream,
        client
      ).catch((err) => this.handleError(new Error(err)))) as IVoiceConnection

      if (!connection) reject('Could not create voice connection')

      this._streams.set(guild.id, stream)

      const onConnectionError = (error) => {
        if (stream?.isPlaying) {
          if (stream.streamDispatcher) stream.streamDispatcher.end()
          if (!stream.queue?.isEmpty) {
            this.sendMessage(
              message,
              `**I'm sorry, my connection failed during the process. Moving on**`
            )
          } else {
            this.resetStreamStatus(stream)
          }
        } else {
          stream?.boundTextChannel.send(
            `**I'm sorry, my connection failed. Please try joining me in again**`
          )
        }
      }

      stream.voiceConnection.on('error', (error) => onConnectionError(error))
      stream.voiceConnection.on('failed', (error) => onConnectionError(error))

      await sentMessage
        .delete()
        .catch((err) => this.handleError(new Error(err)))

      resolve(stream)
    })
  }

  private async createVoiceConnection(
    message: Message,
    stream: MusicStream,
    client: Client // for broadcast, not using
  ): Promise<IVoiceConnection> {
    const voiceChannel = message?.member?.voice?.channel
    if (!voiceChannel) throw new Error('Voice channel not found')

    const connection = (await voiceChannel
      .join()
      .catch((err) => this.handleError(new Error(err)))) as IVoiceConnection
    if (!connection) throw new Error('Could not join the voice channel')

    stream.set('voiceConnection', connection)
    // stream.set('voiceBroadcast', message.client.voice.createBroadcast())

    return connection
  }

  @AccessController({ join: true })
  public async play(
    message: Message,
    args?: Array<string>,
    next: boolean = false,
    @GuildStream() stream?: MusicStream,
    @CurrentGuildMember() member?: GuildMember
  ): Promise<void> {
    stream =
      stream ??
      (await this.createStream(message, member.client).catch((err) =>
        this.handleError(new Error(err))
      ))
    if (!stream) {
      this.sendMessage(
        message,
        'Something went wrong. Could not create the stream. Please try again!'
      )
      this.handleError(new Error('Guild stream was not created.'))
    }

    const query: string = args.join(' ')
    const [isYoutube, isSoundCloud] = [
      isYoutubeUrl(query),
      isSoundCloudUrl(query),
    ]

    let type: 'youtube' | 'soundcloud' = 'youtube'
    if (isSoundCloud) {
      if (isSoundCloudPlaylistUrl(query)) {
        return this.queueSoundCloudPlaylist(stream, message, query)
      } else if (!isSoundCloudSongUrl(query)) {
        this.sendMessage(
          message,
          `**I'm sorry but the link you provided doesn't look like a playable SoundCloud source, please try again with a playlist link or a song link**`
        )
        return
      }
      type = 'soundcloud'
    }
    if (isYoutubePlaylistUrl(query)) {
      return this.queueYoutubePlaylist(stream, message, query).catch(null)
    }
    return this.queueSong({
      stream,
      message,
      args: query,
      type,
      next,
    })
  }

  @AccessController({ join: true })
  public async joinVoiceChannel(
    message: Message,
    @CurrentGuildMember() member?: GuildMember
  ): Promise<void> {
    const connection = await this.createStream(
      message,
      member.client
    ).catch((err) => this.handleError(new Error(err)))
    if (connection)
      this.sendMessage(
        message,
        ' :loudspeaker: Kawaii **Yui-chan** is here~! xD'
      )
    else {
      try {
        const stream = this._streams.get(message.guild.id)
        if (stream) this.leaveVoiceChannel(message, true)
      } catch (err) {
        this.handleError(new Error(err))
      }
      this.sendMessage(
        message,
        '**Connection could not be established. Please try again.**'
      )
    }
  }

  private async startPlaylist({
    message,
    stream,
    data,
    requester,
    type,
  }: {
    message: Message
    stream: MusicStream
    data: IYoutubeVideo[]
    requester: string
    type?: 'youtube' | 'soundcloud'
  }) {
    await Promise.all([
      this.pushToQueue({
        queue: stream.queue,
        data,
        requester,
        atEnd: true,
        type,
      }).catch((err) => this.handleError(new Error(err))),
    ])

    message
      .edit(`:white_check_mark: **Enqueued ${data.length} songs!**`)
      .catch((err) => this.handleError(new Error(err)))

    if (stream.isPlaying === false) {
      stream.set('isPlaying', true)

      this.playMusic(stream)

      this.sendMessage(
        message,
        '**`🎶 Playlist starting - NOW! 🎶`**'
      ).catch((err) => this.handleError(new Error(err)))
    }
  }

  private async queueYoutubePlaylist(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    try {
      const youtubePlaylistId = await YoutubeInfoService.getPlaylistId(
        args
      ).catch(async (err) => {
        // try for video id if exists
        const videoId = await YoutubeInfoService.getVideoId(args)
        if (videoId) {
          return this.queueSong({ stream, message, args, type: 'youtube' })
        }
        throw new Error('Cannot find playlist')
      })

      if (youtubePlaylistId) {
        const sentMessage: Message = await this.sendMessage(
          message,
          ':hourglass_flowing_sand: **_Loading playlist, please wait..._**'
        )
        const requester = message.member.displayName
        const playListVideos = await YoutubeInfoService.getPlaylistItems(
          youtubePlaylistId
        ).catch((err) => this.handleError(new Error(err)))

        if (!playListVideos) {
          this.sendMessage(message, 'Something went terribly wrong!')
          throw new Error(`Couldn't load the playlist`)
        }

        return await this.startPlaylist({
          message: sentMessage,
          stream,
          data: playListVideos,
          requester,
          type: 'youtube',
        })
      }
    } catch (error) {
      this.sendMessage(
        message,
        "Gomennasai, something went wrong and i couldn't get the playlist."
      )
      return this.handleError(error)
    }
  }

  private async queueSoundCloudPlaylist(
    stream: MusicStream,
    message: Message,
    playlistLink: string
  ) {
    try {
      const sentMessage: Message = await this.sendMessage(
        message,
        ':hourglass_flowing_sand: **_Loading playlist from SoundCloud, this may take some times, please wait..._**'
      )
      const playlistSongs: IYoutubeVideo[] = (await SoundCloudService.getInfoUrl(
        playlistLink
      ).catch((err) => this.handleError(new Error(err)))) as IYoutubeVideo[] // checked, should be fine
      if (!playlistSongs || !playlistSongs.length) {
        this.sendMessage(
          message,
          '**Sorry, i could not find any song in that playlist...**'
        )
        return
      }
      return await this.startPlaylist({
        message: sentMessage,
        stream,
        data: playlistSongs,
        requester: message.member.displayName,
        type: 'soundcloud',
      })
    } catch (err) {
      this.sendMessage(
        message,
        "Gomennasai, something went wrong and i couldn't get the playlist."
      )
      return this.handleError(err)
    }
  }

  private async queueSong({
    stream,
    message,
    args,
    type,
    next,
  }: {
    stream: MusicStream
    message: Message
    args: string
    type?: 'youtube' | 'soundcloud'
    next?: boolean
  }): Promise<void> {
    const queue: MusicQueue = stream.queue
    const requester: string = message.member.displayName
    type = type || 'youtube'
    let tempStatus: string
    let itemInfo: IYoutubeVideo[]
    if (type === 'youtube') {
      const videoId = await YoutubeInfoService.getVideoId(args)
      itemInfo = await YoutubeInfoService.getInfoIds(videoId)
    } else {
      const song = (await SoundCloudService.getInfoUrl(args).catch((err) =>
        this.handleError(new Error(err))
      )) as IYoutubeVideo
      if (!song) {
        this.sendMessage(message, '**Something went wrong...**')
        return
      }
      itemInfo = [song]
    }

    await Promise.all([
      this.pushToQueue({
        queue,
        data: itemInfo,
        requester,
        atEnd: !!next,
        type,
      }),
    ])
    if (!stream.isPlaying) {
      stream.set('isPlaying', true)
      this.playMusic(stream)
      tempStatus = '♫ Now Playing ♫'
    } else tempStatus = '♬ Added To QUEUE ♬'
    var nowPlayingDescription = `*\`Channel\`*: **\`${
      queue.last.channelTitle
    }\`**\n*\`Duration\`*: **\`${await timeConverter(queue.last.duration)}\`**${
      queue.length === 1
        ? ``
        : `\n*\`Position in queue\`*: **\`${queue.length - 1}\`**`
    }`

    const embed = await discordRichEmbedConstructor({
      title: queue.last.title,
      author: {
        authorName: tempStatus,
        avatarUrl: message.author.avatarURL(),
      },
      description: nowPlayingDescription,
      color: Constants.YUI_COLOR_CODE,
      thumbnailUrl: queue.last.videoThumbnail,
      appendTimeStamp: true,
      titleUrl: queue.last.videoUrl,
      footer: `Requested by ${requester}`,
    })

    this.sendMessage(message, embed)
  }

  private pushToQueue({
    queue,
    data,
    requester,
    atEnd,
    type,
  }: {
    queue: MusicQueue
    data: IYoutubeVideo[]
    requester: string
    atEnd?: boolean
    type?: 'youtube' | 'soundcloud'
  }): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      if (!data || !data.length) {
        this.handleError(new Error('No data was supplied'))
        resolve(false)
      } else {
        const promises = data.map(async (_song: IYoutubeVideo) => {
          if (!_song.id) {
            return this.handleError(new Error('Song id was undefined.'))
          }
          const { id, snippet, contentDetails, soundcloudInfo, songUrl } = _song
          const { title, channelId, channelTitle, thumbnails } = snippet
          const song: ISong = {
            id,
            title: title,
            channelId,
            channelTitle,
            duration:
              type === 'youtube'
                ? await youtubeTimeConverter(contentDetails.duration)
                : contentDetails.rawDuration,
            requester,
            videoUrl:
              type === 'youtube'
                ? `https://www.youtube.com/watch?v=${id}`
                : songUrl,
            videoThumbnail: thumbnails.default.url,
            type: type || 'youtube',
            soundcloudInfo,
          }
          atEnd ? queue.addSong(song) : queue.addNext(song)
        })
        await Promise.all(promises)
        resolve(true)
      }
    })
  }

  private async playMusic(stream: MusicStream): Promise<void> {
    try {
      const { type, id, videoUrl, soundcloudInfo } = stream.queue.at(0)

      const downloadOptions: ytdl.downloadOptions = {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 24, // max 16MB
        liveBuffer: 40000,
      }

      const ytdlStream: Readable =
        type === 'youtube'
          ? ytdl(`https://www.youtube.com/watch?v=${id}`, downloadOptions)
          : await PolarisSoundCloudPlayer.createMusicStream(
              soundcloudInfo,
              downloadOptions
            )

      this.playStream(stream, ytdlStream, {
        volume: 0.8,
        highWaterMark: 50,
      })

      let sent: Message
      stream.streamDispatcher.on('start', async () => {
        stream.voiceConnection.player.streamingData.pausedTime = 0
        if (!stream.isLooping) {
          sent = await this.sendMessageChannel(
            stream,
            '**` 🎧 Now Playing: ' + stream.queue.at(0).title + '`**'
          )
        }
      })

      const onStreamEnd = ({
        error,
        reason,
      }: {
        error?: string | Error
        reason?: string
      }) => {
        // destroy ongoing stream (if there is)
        try {
          ytdlStream.destroy()
        } catch (err) {
          // just in case
          this.handleError(err)
        }

        if (error) {
          this.handleError(error as string)
        }

        if (sent && !stream.isLooping) {
          sent
            .delete({ timeout: 50 })
            .catch((err) => this.handleError(new Error(err)))
        }

        const endedSong = stream.queue.shiftSong()
        if (stream.isLooping) {
          stream.queue.unshiftSong(endedSong)
        } else if (stream.isQueueLooping) {
          stream.queue.addSong(endedSong)
        }

        if (stream.queue.isEmpty) {
          if (!stream.isAutoPlaying) {
            return this.resetStreamStatus(stream)
          } else {
            return this.autoPlaySong(stream, endedSong)
          }
        }

        return this.playMusic(stream)
      }

      // youtube-dl/ytdl error ? TODO: CHECK IF ANYTHING FATAL
      // ytdlStream.on('error', (error: Error) =>
      //   this.handleError(new Error(error.message))
      // )
      stream.streamDispatcher.on('finish', (reason) => onStreamEnd({ reason }))
      stream.streamDispatcher.on('error', (error) => onStreamEnd({ error }))
    } catch (err) {
      this.handleError(new Error(err))
    }
  }

  // private playBroadcast(
  //   stream: MusicStream,
  //   input: Readable | string,
  //   options: StreamOptions
  // ): BroadcastDispatcher {

  //   const broadcast = stream.voiceBroadcast.play(input, options)
  //   const streamDispatcher = stream.voiceConnection.play(stream.voiceBroadcast)
  //   stream.set('streamDispatcher', streamDispatcher)
  //   stream.set('broadcastDispatcher', broadcast)
  //   return broadcast
  // }

  private playStream(
    stream: MusicStream,
    input: Readable | string,
    options: StreamOptions
  ): StreamDispatcher {
    const streamDispatcher = stream.voiceConnection.play(input, options)
    stream.set('streamDispatcher', streamDispatcher)
    return streamDispatcher
  }

  @AccessController()
  public async skipSongs(
    message: Message,
    args?: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (stream.queue.isEmpty) {
      await this.sendMessage(
        message,
        '**There is nothing playing at the moment...**'
      )
      return
    }
    const firstArg = (args.length && args.shift().toLowerCase()) || null
    if (!firstArg) {
      if (stream.isLooping) {
        stream.set('isLooping', false)
      }
      if (!!stream.streamDispatcher) {
        stream.streamDispatcher.end()
        this.sendMessage(message, ' :fast_forward: **Skipped!**')
        return
      }
    } else {
      const firstArgToNumber = Number(firstArg)
      if (!Number.isNaN(firstArgToNumber)) {
        if (firstArgToNumber < 0 || firstArgToNumber > stream.queue.length) {
          await this.sendMessage(
            message,
            '**The number you gave is bigger than the current queue!**'
          )
          return
        }
        stream.queue.spliceSongs(1, firstArgToNumber)
        if (stream.isLooping) {
          stream.set('isLooping', false)
        }
        if (stream.streamDispatcher) {
          this.sendMessage(
            message,
            ` :fast_forward: **Skipped ${firstArgToNumber} songs!**`
          )
          stream.streamDispatcher.end()
          return
        }
      } else {
        this.sendMessage(message, '**Please select a number**')
        return
      }
    }
  }

  @AccessController({ join: false, silent: true })
  public async setVolume(
    message: Message,
    args: Array<string>,
    @GuildStream() stream?: MusicStream
  ) {
    if (!args.length) {
      this.sendMessage(message, '**Please choose a specific volume number!**')
    }

    const newVolume = Number(args.shift())

    if (!Number.isNaN(newVolume) && newVolume < 0 && newVolume > 100) {
      this.sendMessage(
        message,
        '**Please choose a valid number! (0 <= volume <= 100)**'
      )
    }

    const currentVolume = stream.streamDispatcher.volume

    stream.streamDispatcher.setVolume(newVolume / 100)

    this.sendMessage(
      message,
      `**Volume ${currentVolume < newVolume ? `incleased` : `decreased`} from ${
        currentVolume * 100
      } to ${newVolume}**`
    )
  }

  @AccessController({ join: true })
  public async autoPlay(
    message: Message,
    @GuildStream() stream?: MusicStream,
    @CurrentGuildMember() member?: GuildMember
  ): Promise<void> {
    if (!stream) {
      stream = await this.createStream(message, member.client)
    }
    if (!stream?.isAutoPlaying) {
      stream.set('isAutoPlaying', true)
      this.sendMessage(
        message,
        "**`📻 YUI's PABX MODE - ON! 🎵`**"
      ).catch((err) => this.handleError(new Error(err)))
      if (stream?.queue?.isEmpty) {
        this.sendMessage(
          message,
          'Ok, now where do we start? How about you add something first? XD'
        ).catch((err) => this.handleError(new Error(err)))
      }
      return
    } else {
      stream.set('isAutoPlaying', false)
      this.sendMessage(
        message,
        "**`📻 YUI's PABX MODE - OFF! 🎵`**"
      ).catch((err) => this.handleError(new Error(err)))
      return
    }
  }

  async autoPlaySong(stream: MusicStream, endedSong: ISong) {
    if (endedSong.type === 'soundcloud') {
      stream._boundTextChannel
        .send(
          '**Autoplay mode is currently only available with Youtube videos, please add a youtube song.'
        )
        .catch((err) => this.handleError(new Error(err)))
      return
    }
    stream.set('tempChannelId', endedSong.channelId)
    const videoInfo = await YoutubeInfoService.getSongsByChannelId(
      stream.tempChannelId,
      stream.nextPage
    )
    const { nextPageToken, items } = videoInfo
    stream.set('nextPage', nextPageToken)
    const rand = await RNG(items.length)
    const songMetadata = await YoutubeInfoService.getInfoIds(
      items[rand].id.videoId
    )
    await Promise.all([
      this.pushToQueue({
        queue: stream.queue,
        data: songMetadata,
        requester: endedSong.requester,
        atEnd: false,
      }),
    ])
    this.playMusic(stream)
  }

  @AccessController()
  public async getNowPlayingData(
    message: Message,
    @GuildStream() stream?: MusicStream,
    @CurrentGuildMember() member?: GuildMember
  ) {
    stream = stream!
    if (stream.queue.isEmpty) {
      return this.sendMessage(message, `**Nothing is playing!**`)
    }
    const currSong = stream.queue.at(0)
    const streamingTime = Math.round(
      (stream?.streamDispatcher?.streamTime || 0) / 1000
    )
    const content = `**\`${await timeConverter(
      streamingTime
    )}\`𝗹${await createProgressBar(
      streamingTime,
      currSong.duration
    )}𝗹\`${await timeConverter(currSong.duration)}\`**\n__\`Channel\`__: **\`${
      currSong.channelTitle
    }\`**`
    const embed = await discordRichEmbedConstructor({
      title: currSong.title,
      author: {
        authorName: '♫ Now Playing ♫',
        avatarUrl: member.user.avatarURL(),
      },
      description: content,
      thumbnailUrl: currSong.videoThumbnail,
      titleUrl: currSong.videoUrl,
      footer: `Requested by ${currSong.requester}`,
    })
    await this.sendMessage(message, embed)
  }

  @AccessController()
  public async printQueue(
    message: Message,
    args: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (stream?.queue?.isEmpty) {
      this.sendMessage(message, `**Nothing in queue!**`)
      return
    }
    const numberOfSongs = stream.queue.length
    const limit = 10
    const tabs = Math.floor((numberOfSongs - 1) / limit) + 1
    const firstArg = (args.length && Number(args.shift().toLowerCase())) || 1
    if (firstArg > tabs) {
      this.sendMessage(
        message,
        'Index out of range! Please choose a valid one, use `>queue` for checking.'
      )
      return
    }
    if (firstArg === 1) {
      const nowPlaying = stream.queue.at(0)
      let data = `**__NOW PLAYING:__\n\`🎶\`${
        nowPlaying.title
      }\`🎶\`** - \`(${await timeConverter(
        nowPlaying.duration
      )})\`\n*Requested by \`${nowPlaying.requester}\`*\n\n`
      const start = 1
      const end = numberOfSongs <= 10 ? numberOfSongs - 1 : limit
      if (numberOfSongs >= 2) {
        data += `**__QUEUE LIST:__**\n
          ${await printQueueList(stream.queue, start, end)}
          ${
            numberOfSongs > 11
              ? `\`And another ${numberOfSongs - 11} songs.\``
              : ``
          }\n`
      }
      data += `**${
        stream.name
      }'s** total queue duration: \`${await this.getQueueLength(
        stream
      )}\` -- Tab: \`1/${tabs}\``
      this.sendMessage(
        message,
        await discordRichEmbedConstructor({
          description: data,
        })
      )
    } else {
      const startPosition = (firstArg - 1) * limit + 1
      let endPos = startPosition + limit - 1
      const endPosition =
        endPos > numberOfSongs - 1 ? numberOfSongs - 1 : endPos
      const data = `**__QUEUE LIST:__**\n${await printQueueList(
        stream.queue,
        startPosition,
        endPosition
      )}**${
        stream.name
      }'s** total queue duration: \`${await this.getQueueLength(
        stream
      )}\` -- Tab: \`${firstArg}/${tabs}\``
      this.sendMessage(
        message,
        await discordRichEmbedConstructor({
          description: data,
        })
      )
    }
    return
  }

  private async getQueueLength(stream: MusicStream): Promise<string | number> {
    if (stream.isLooping) return STREAM_STATUS.LOOPING
    if (stream.isQueueLooping) return STREAM_STATUS.QUEUE_LOOPING
    return await timeConverter(await stream.queue.totalDuration)
  }

  @AccessController()
  public async removeSongs(
    message: Message,
    args?: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!

    if (!args.length) {
      this.sendMessage(
        message,
        '*Please choose certain song(s) from QUEUE to remove.*'
      )
      return
    }

    const firstArg = args.shift().toLowerCase() || null
    const secondArg = (args.length && args.shift().toLowerCase()) || null

    const firstArgToNumber = Number(firstArg)
    if (!secondArg || Number.isNaN(firstArgToNumber)) {
      if (Number.isNaN(firstArgToNumber)) {
        if (firstArg !== 'last') {
          this.sendMessage(message, 'Invailid option! Action aborted.')
          return
        } else {
          if (stream.queue.length === 1)
            return await this.skipSongs(message, args)
          else
            this.sendMessage(
              message,
              `**\`${stream.queue.popSong()}\` has been removed from QUEUE!**`
            )
        }
      }
      if (firstArgToNumber < 0 || firstArgToNumber > stream.queue.length) {
        this.sendMessage(
          message,
          `Index out of range! Please choose a valid one, use \`>queue\` for checking.`
        )
        return
      }
      if (firstArgToNumber === 0) {
        return await this.skipSongs(message, args)
      } else {
        this.sendMessage(
          message,
          `**\`${stream.queue.spliceSongs(
            firstArgToNumber
          )}\` has been removed from QUEUE!**`
        )
        return
      }
    } else {
      const secondArgToNumber = Number(secondArg)
      if (Number.isNaN(secondArgToNumber)) {
        this.sendMessage(message, 'Invailid option! Action aborted.')
        return
      }

      if (
        firstArgToNumber < 1 ||
        firstArgToNumber > stream.queue.length ||
        firstArgToNumber + secondArgToNumber > stream.queue.length
      ) {
        this.sendMessage(
          message,
          'Index out of range! Please choose a valid one, use `>queue` for checking.'
        )
        return
      }
      stream.queue.spliceSongs(firstArgToNumber, secondArgToNumber)
      this.sendMessage(
        message,
        `**Songs from number ${firstArgToNumber} to ${
          firstArgToNumber + secondArgToNumber - 1
        } removed from QUEUE!**`
      )
    }
  }

  @AccessController({ join: false, silent: true })
  public async searchSong(
    message: Message,
    args?: Array<string>
  ): Promise<void> {
    const _arguments = args?.join(' ')
    const result = await YoutubeInfoService.searchByQuery(
      _arguments
    ).catch((err) => this.handleError(new Error(err)))
    const { items } = result

    let tableContent = '**```css\n'
    items.map((item, index) => {
      tableContent += `#${index + 1}: ${item.snippet.title.replace(
        '&amp;',
        '&'
      )}\n\n`
    })
    tableContent += '```**'
    const embed = await discordRichEmbedConstructor({
      title: `**Pick one option from the list below, or type \`cancel\` to abort.**`,
      description: tableContent,
    })

    const sentContent = await this.sendMessage(message, embed)

    const collectorFilter = (messageFilter: Message) =>
      messageFilter.author.id === message.author.id &&
      messageFilter.channel.id === message.channel.id

    const collectorOptions: MessageCollectorOptions = {
      time: 15000,
      max: 1,
    }
    const collector = message.channel.createMessageCollector(
      collectorFilter,
      collectorOptions
    )

    collector.on('collect', async (collected: Message) => {
      collector.stop()
      if (collected.content.toLowerCase() === 'cancel') {
        this.sendMessage(message, '**`Canceled!`**')
        sentContent.delete().catch((err) => this.handleError(new Error(err)))
        return
      } else {
        const index = Number(collected.content.trim().split(' ')[0])
        if (!isNaN(index) && index > 0 && index <= 10) {
          sentContent.delete().catch((err) => this.handleError(new Error(err)))
          const args = [items[index - 1].id.videoId]
          return await this.play(message, args)
        } else {
          this.sendMessage(message, 'Invailid option! Action aborted.')
          await sentContent
            .delete()
            .catch((err) => this.handleError(new Error(err)))
          return
        }
      }
    })
    collector.on('end', (collected) => {
      if (sentContent)
        sentContent.delete().catch((err) => this.handleError(new Error(err)))
      if (collected.size < 1)
        this.sendMessage(message, ':ok_hand: Action aborted.')
      return
    })
  }

  @AccessController()
  public async shuffleQueue(
    message: Message,
    @GuildStream() stream?: MusicStream
  ) {
    stream = stream!
    if (!stream.queue.isEmpty) {
      stream.queue.shuffle()
      this.sendMessage(
        message,
        ':twisted_rightwards_arrows: **QUEUE shuffled!**'
      )
    } else {
      this.sendMessage(message, "I'm not playing anything!")
    }
  }

  @AccessController()
  public async clearQueue(
    message: Message,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (!stream.queue.isEmpty) {
      stream.queue.clearQueue()
      this.sendMessage(message, ':x: **Queue cleared!**')
    } else {
      this.sendMessage(message, '**Queue is empty.**')
    }
  }

  @AccessController()
  public async loopSettings(
    message: Message,
    args: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (!stream) {
      this.handleError(new Error('Undefined stream value'))
      return
    }

    const firstArg = (args.length && args.shift().toLowerCase()) || null

    if (!firstArg) {
      if (!stream.isLooping) {
        stream.set('isLooping', true)
        this.sendMessage(message, ' :repeat: _**Loop enabled!**_')
      } else {
        stream.set('isLooping', false)
        this.sendMessage(
          message,
          ' :twisted_rightwards_arrows: _**Loop disabled!**_'
        )
      }
    } else if (firstArg === 'queue') {
      if (!stream.isQueueLooping) {
        stream.set('isQueueLooping', true)
        this.sendMessage(message, ' :repeat: _**Queue loop enabled!**_')
      } else {
        stream.set('isQueueLooping', false)
        this.sendMessage(
          message,
          ' :twisted_rightwards_arrows: _**Queue loop disabled!**_'
        )
      }
    } else {
      this.sendMessage(
        message,
        `**I'm sorry but what do you mean by \`${firstArg}\` ?**`
      )
    }
  }

  @AccessController()
  public async musicController(
    message: Message,
    isPause: boolean,
    @GuildStream() stream?: MusicStream
  ) {
    stream = stream!
    if (!stream) {
      this.handleError(new Error('Undefined stream value'))
      return
    }
    if (stream.streamDispatcher) {
      isPause ? this.setPause(stream) : this.setResume(stream)
      return
    } else {
      this.sendMessage(message, "I'm not playing anything.")
    }
    return
  }

  private setPause(stream: MusicStream): Promise<void> {
    if (!stream.isPaused) {
      stream.streamDispatcher.pause()
      stream.set('isPaused', true)
      this.sendMessageChannel(stream, ':pause_button: **Paused!**')
    } else {
      this.sendMessageChannel(stream, '*Currently paused!*')
    }
    return
  }

  private setResume(stream: MusicStream): Promise<void> {
    if (stream.isPaused) {
      stream.streamDispatcher.pause()
      stream.set('isPaused', false)
      this.sendMessageChannel(stream, ' :arrow_forward: **Continue playing~!**')
    } else {
      this.sendMessageChannel(stream, '*Currently playing!*')
    }
    return
  }

  public resetStreamStatus(stream: MusicStream) {
    if (stream?.id) {
      stream.set('isAutoPlaying', false)
      stream.set('isQueueLooping', false)
      stream.set('isLooping', false)
      stream.set('isPaused', false)
      stream.set('nextPage', null)
      stream.queue.deleteQueue()
      if (stream.isPlaying) {
        if (stream.streamDispatcher) {
          stream.streamDispatcher.destroy()
        }
        stream.set('isPlaying', false)
      }
    } else {
      this.handleError(new Error('`stream` as undefined'))
      return
    }
    return
  }

  @AccessController()
  public stopPlaying(message: Message, @GuildStream() stream?: MusicStream) {
    if (stream?.isPlaying) {
      stream.queue.deleteQueue()
      this.resetStreamStatus(stream)
      this.sendMessage(message, '**Stopped!**')
    } else {
      this.sendMessage(message, '**Nothing is playing!**')
    }
  }

  public deleteStream(stream: MusicStream) {
    stream.set('boundTextChannel', null)
    stream.set('boundVoiceChannel', null)
    this._streams.delete(stream.id)
  }

  @AccessController({ silent: true })
  public async leaveVoiceChannel(
    message: Message,
    isError: boolean = false,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    try {
      if (!stream) throw new Error('[leaveVoiceChannel] Stream not found!')

      stream.boundVoiceChannel.leave()

      this.resetStreamStatus(stream)
      this.deleteStream(stream)

      if (!isError) this.sendMessage(message, '**_Bye bye~! Matta nee~!_**')
    } catch (err) {
      this.handleError(err)
    }
  }

  public async soundcloudGetSongInfo(message: Message, link: string) {
    // const info = await SoundCloudService.getInfoYtdl(link).catch((err) =>
    //   this.handleError(new Error(err))
    // )
  }

  public async sendMessage(
    message: Message,
    content: string | MessageEmbed
  ): Promise<Message> {
    return await message.channel
      .send(content)
      .catch((err) => this.handleError(new Error(err)))
  }

  public async sendMessageChannel(
    stream: MusicStream,
    content: string | MessageEmbed
  ): Promise<Message> {
    return await stream.boundTextChannel
      .send(content)
      .catch((err) => this.handleError(new Error(err)))
  }

  public get streams(): Map<string, MusicStream> {
    return this._streams
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.MUSIC_SERVICE)
  }
}
