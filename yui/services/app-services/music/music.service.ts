import { Constants, LOG_SCOPE } from '@/constants/constants'
import { AccessController, MusicParam } from '@/ioc-container/decorators/music.decorator'
import { IVoiceConnection } from '@/interfaces/custom-interfaces.interface'
import {
  GuildMember,
  Message,
  MessageCollectorOptions,
  MessageEmbed,
  StreamDispatcher,
  StreamOptions,
  TextChannel,
} from 'discord.js'
import { PassThrough, Readable } from 'stream'
import ytdl from 'ytdl-core'
import { discordRichEmbedConstructor } from '../utilities/discord-embed-constructor'
import { RNG } from '../utilities/util-function'
import { MusicQueue } from './music-entities/music-queue'
import { MusicStream } from './music-entities/music-stream'
import { ISong } from './music-interfaces/song-metadata.interface'
import { IYoutubeVideo } from './music-interfaces/youtube-info.interface'
import {
  createProgressBar,
  printQueueList,
  STREAM_STATUS,
  timeConverter,
} from './music-util/music-utilities'
import { PolarisSoundCloudService } from './soundcloud-service/soundcloud-info.service'
import { PolarisSoundCloudPlayer } from './soundcloud-service/soundcloud-player.service'
import {
  isSoundCloudPlaylistUrl,
  isSoundCloudSongUrl,
  isSoundCloudUrl,
} from './soundcloud-service/soundcloud-utilities'
import { YoutubeInfoService } from './youtube-service/youtube-info.service'
import {
  isYoutubePlaylistUrl,
  isYoutubeUrl,
  youtubeTimeConverter,
} from './youtube-service/youtube-utilities'
import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { YuiLogger } from '@/services/logger/logger.service'
import { GlobalMusicStream } from '../../../custom-classes/global-music-streams'
import { ConfigService } from '@/config-service/config.service'
@Injectable()
export class MusicService {
  constructor(
    private youtubeInfoService: YoutubeInfoService,
    private soundcloudService: PolarisSoundCloudService,
    private soundcloudPlayer: PolarisSoundCloudPlayer,
    public streams: GlobalMusicStream,
    public configService: ConfigService
  ) {
    YuiLogger.info(`Created!`, LOG_SCOPE.MUSIC_SERVICE)
  }

  private async createStream(message: Message): Promise<MusicStream | null> {
    const sentMessage = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Preparing, just one moment! ;)_**'
    )

    const { guild, channel: textChannel, member } = message
    const voiceChannel = member.voice?.channel
    const existingStream = this.streams.get(guild.id)

    if (existingStream) return existingStream
    const connection = await this.createVoiceConnection(message)
    if (!connection) throw new Error('Could not create voice connection')

    const stream = new MusicStream(guild, voiceChannel, textChannel as TextChannel)
    stream.set('voiceConnection', connection)
    this.streams.set(guild.id, stream)

    this.sendMessage(
      message,
      `**Bound to Text Channel: \`${textChannel['name']}\` and Voice Channel: \`${voiceChannel?.name}\`**!`
    )

    const onConnectionError = (error: Error) => {
      this.handleError(error)
      if (stream?.isPlaying) {
        if (stream.streamDispatcher) stream.streamDispatcher.end()
        this.resetStreamStatus(stream)
      }
      this.sendMessage(message, `**Connection lost...**`)
    }
    stream.voiceConnection.on('error', (error) => onConnectionError(error))
    stream.voiceConnection.on('failed', (error) => onConnectionError(error))

    this.deleteMessage(sentMessage)
    return stream
  }

  private async createVoiceConnection(message: Message): Promise<IVoiceConnection> {
    const {
      voice: { channel: voiceChannel },
    } = message.member || {}
    if (!voiceChannel) throw new Error('Voice channel not found')
    const connection = (await voiceChannel.join()) as IVoiceConnection
    connection.voice?.setSelfDeaf(true).catch(null)

    return connection
  }
  public async play(message: Message, args: string[], next: boolean, ...otherArgs)
  @AccessController({ join: true })
  public async play(
    message: Message,
    args: string[],
    next: boolean,
    @MusicParam('STREAM') stream: MusicStream
  ): Promise<void> {
    stream = stream ?? (await this.createStream(message))

    if (!stream) return

    const query: string = args.join(' ')

    const [isYoutube, isSoundCloud] = [isYoutubeUrl(query), isSoundCloudUrl(query)]

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

    if (isYoutubePlaylistUrl(query))
      return this.queueYoutubePlaylist(stream, message, query).catch(null)

    return this.enqueueSong({
      stream,
      message,
      args: query,
      type,
      next,
    })
  }

  @AccessController({ join: true })
  public async joinVoiceChannel(message: Message): Promise<void> {
    const connection = await this.createStream(message).catch((err) =>
      this.handleError(new Error(err))
    )
    if (connection) this.sendMessage(message, ' :loudspeaker: Kawaii **Yui-chan** is here~! xD')
    else {
      try {
        const stream = this.streams.get(message.guild.id)
        if (stream) this.leaveVoiceChannel(message, true)
      } catch (err) {
        this.handleError(new Error(err))
      }
      this.sendMessage(message, '**Connection could not be established. Please try again.**')
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
    await this.pushToQueue({
      queue: stream.queue,
      data,
      requester,
      type,
    })

    message
      .edit(`:white_check_mark: **Enqueued ${data.length} songs!**`)
      .catch((err) => this.handleError(new Error(err)))

    if (stream.isPlaying === false) {
      stream.set('isPlaying', true)

      this.playMusic(stream)

      this.sendMessage(message, '**`🎶 Playlist starting - NOW! 🎶`**')
    }
  }

  private async queueYoutubePlaylist(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    const youtubePlaylistId = await this.youtubeInfoService.getYoutubePlaylistId(args)
    if (!youtubePlaylistId) {
      // try for video id if exists
      const videoId = await this.youtubeInfoService.getYoutubeVideoId(args)
      if (videoId) {
        return this.enqueueSong({ stream, message, args, type: 'youtube' })
      }
      throw new Error('Cannot find playlist')
    }
    const sentMessage: Message = await this.sendMessage(
      message,
      ':hourglass_flowing_sand: **_Loading playlist, please wait..._**'
    )
    const requester = message.member.displayName
    const playListVideos = await this.youtubeInfoService
      .getPlaylistItems(youtubePlaylistId)
      .catch((err) => this.handleError(err))

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

      const playlistSongs: IYoutubeVideo[] = (await this.soundcloudService.getInfoUrl(
        playlistLink,
        {
          getUrl: false,
        }
      )) as IYoutubeVideo[] // checked, should be fine

      if (!playlistSongs || !playlistSongs.length) {
        this.sendMessage(message, '**Sorry, i could not find any song in that playlist...**')
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
      this.sendMessage(message, "Gomennasai, something went wrong and i couldn't get the playlist.")
      return this.handleError(err)
    }
  }

  private async enqueueSong({
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
    let data: IYoutubeVideo[]
    if (type === 'youtube') {
      const videoId = await this.youtubeInfoService.getYoutubeVideoId(args)
      data = await this.youtubeInfoService.getInfoIds(videoId)
    } else {
      const song = (await this.soundcloudService
        .getInfoUrl(args)
        .catch((err) => this.handleError(err))) as IYoutubeVideo
      if (!song) {
        this.sendMessage(message, '**Something went wrong...**')
        return
      }
      data = [song]
    }

    this.pushToQueue({
      queue,
      data,
      requester,
      next,
      type,
    })

    const sendInfoToChannelCallback = (forQueue: MusicQueue) => {
      const queuedSong = next ? forQueue.firstInQueue : forQueue.last
      if (!queuedSong) return
      const nowPlayingDescription = `*\`Channel\`*: **\`${
        queuedSong.channelTitle
      }\`**\n*\`Duration\`*: **\`${timeConverter(queuedSong.duration)}\`**${
        forQueue.length === 1 ? `` : `\n*\`Position in queue\`*: **\`${forQueue.length - 1}\`**`
      }`

      const embed = discordRichEmbedConstructor({
        title: queuedSong.title,
        author: {
          authorName: tempStatus,
          avatarUrl: message.author.avatarURL(),
        },
        description: nowPlayingDescription,
        color: Constants.YUI_COLOR_CODE,
        thumbnailUrl: queuedSong.videoThumbnail,
        appendTimeStamp: true,
        titleUrl: queuedSong.videoUrl,
        footer: `Requested by ${requester}`,
      })

      this.sendMessage(message, embed)
    }

    if (!stream.isPlaying) {
      stream.set('isPlaying', true)
      tempStatus = '♫ Now Playing ♫'
      await this.playMusic(stream)
      sendInfoToChannelCallback(queue)
    } else {
      tempStatus = '♬ Added To QUEUE ♬'
      sendInfoToChannelCallback(queue)
    }
  }

  private pushToQueue({
    queue,
    data,
    requester,
    next,
    type = 'youtube',
  }: {
    queue: MusicQueue
    data: IYoutubeVideo[]
    requester: string
    next?: boolean
    type?: 'youtube' | 'soundcloud'
  }) {
    if (!data || !data.length) this.handleError('No data was supplied')

    data.map((song: IYoutubeVideo) => {
      if (!song.id) return this.handleError('Song id was undefined.')

      const { id, snippet, contentDetails, songUrl } = song
      const { title, channelId, channelTitle, thumbnails } = snippet
      const toAddSong: ISong = {
        id,
        title: title,
        channelId,
        channelTitle,
        duration:
          type === 'youtube'
            ? youtubeTimeConverter(contentDetails.duration)
            : contentDetails.rawDuration,
        requester,
        videoUrl: type === 'youtube' ? `https://www.youtube.com/watch?v=${id}` : songUrl,
        videoThumbnail: thumbnails.default.url,
        type: type || 'youtube',
      }
      if (next) return queue.addNext(toAddSong)
      queue.addSong(toAddSong)
    })
  }

  private async playMusic(stream: MusicStream): Promise<void> {
    let deleteTrigger: (timeout: number) => any = null
    let inputStream: Readable | PassThrough
    const onStreamEnd = ({ error, reason }: { error?: string | Error; reason?: string }) => {
      if (inputStream && !inputStream.destroyed) inputStream.destroy()
      if (error) this.handleError(error as string)

      const { isLooping, queue, isAutoPlaying, isQueueLooping } = stream
      if (!isLooping && deleteTrigger) deleteTrigger(200)

      const endedSong = queue.first
      if (!stream.isLooping) queue.removeFirst()
      else if (isQueueLooping) queue.addSong(queue.removeFirst())

      if (queue.isEmpty) {
        if (!isAutoPlaying) return this.resetStreamStatus(stream)
        else return this.autoPlaySong(stream, endedSong)
      }

      return this.playMusic(stream)
    }
    try {
      const { type, id, videoUrl } = stream.queue.at(0)

      const downloadOptions: ytdl.downloadOptions = {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 24, // max 16MB
        liveBuffer: 40000,
      }

      inputStream =
        type === 'youtube'
          ? ytdl(`https://www.youtube.com/watch?v=${id}`, downloadOptions)
          : await this.soundcloudPlayer.createMusicStream(videoUrl, downloadOptions)

      if (!inputStream) throw new Error('Stream not created.')

      this.playStream(stream, inputStream, {
        volume: 0.8,
        highWaterMark: 50,
      })

      stream.streamDispatcher.on('start', async () => {
        try {
          stream.voiceConnection.player.streamingData.pausedTime = 0
        } catch (e) {}
        if (!stream.isLooping) {
          deleteTrigger = await this.sendMessageChannel(
            stream,
            discordRichEmbedConstructor({
              title: `${!stream.isAutoPlaying ? '🎧  Now Playing' : ':infinity: Autoplaying'}: ${
                stream.queue.first.title
              }`,
              description: '',
            })
          ).then((message) => (timeout: number) => message.delete({ timeout }))
        }
      })

      stream.streamDispatcher.on('finish', (reason) => onStreamEnd({ reason }))
      stream.streamDispatcher.on('error', (error) => onStreamEnd({ error }))
    } catch (error) {
      onStreamEnd({ error })
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
    if (stream.streamDispatcher && !stream.streamDispatcher.destroyed)
      stream.streamDispatcher.destroy()
    const newDispatcher = stream.voiceConnection.play(input, options)
    stream.set('streamDispatcher', newDispatcher)
    return newDispatcher
  }

  skipSongs(message: Message, args: string[], ...otherArgs)
  @AccessController()
  public async skipSongs(
    message: Message,
    args: string[],
    @MusicParam('STREAM') stream: MusicStream
  ) {
    if (stream.queue.isEmpty)
      return this.sendMessage(message, '**There is nothing playing at the moment...**')

    const { [0]: firstArg = undefined } = args || []
    if (!firstArg) {
      if (stream.isLooping) {
        stream.set('isLooping', false)
      }
      if (stream.streamDispatcher) {
        stream.streamDispatcher.end()
        return this.sendMessage(message, ' :fast_forward: **Skipped!**')
      }
    } else {
      const firstParam = +firstArg
      if (!Number.isNaN(firstParam)) {
        if (firstParam < 0 || firstParam > stream.queue.length)
          return this.sendMessage(
            message,
            '**The number you gave is bigger than the current queue!**'
          )

        stream.queue.removeSongs(1, firstParam)

        if (stream.isLooping) stream.set('isLooping', false)

        if (stream.streamDispatcher) {
          stream.streamDispatcher.end()
          return this.sendMessage(message, ` :fast_forward: **Skipped ${firstParam} songs!**`)
        }
      }
    }
  }

  setVolume(message: Message, args: Array<string>, ...otherArgs)
  @AccessController({ join: false, silent: true })
  public setVolume(
    message: Message,
    args: Array<string>,
    @MusicParam('STREAM') stream: MusicStream
  ): void {
    if (!args.length) {
      this.sendMessage(message, '**Please choose a specific volume number!**')
    }

    const newVolume = Number(args.shift())

    if (!Number.isNaN(newVolume) && newVolume < 0 && newVolume > 100) {
      this.sendMessage(message, '**Please choose a valid number! (0 <= volume <= 100)**')
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

  autoPlay(message: Message, ...args)
  @AccessController({ join: true })
  public async autoPlay(
    message: Message,
    @MusicParam('STREAM') stream?: MusicStream
  ): Promise<void> {
    if (!stream) stream = await this.createStream(message)

    if (!stream?.isAutoPlaying) {
      stream.set('isAutoPlaying', true)
      this.sendMessage(
        message,
        discordRichEmbedConstructor({
          title: ":infinity: Yui's PABX mode - ON! 🎵",
          description: '',
        })
      )
      if (stream?.queue?.isEmpty) {
        this.sendMessage(
          message,
          'Ok, now where do we start? How about you add something first? XD'
        )
      }
      return
    } else {
      stream.set('isAutoPlaying', false)
      this.sendMessage(
        message,
        discordRichEmbedConstructor({ title: "Yui's PABX mode - OFF~", description: '' })
      )
      return
    }
  }

  private async autoPlaySong(stream: MusicStream, endedSong: ISong) {
    if (endedSong.type === 'soundcloud') {
      stream._boundTextChannel
        .send(
          '**Autoplay mode is currently only available with Youtube videos, please add a youtube song.'
        )
        .catch((err) => this.handleError(new Error(err)))
      return
    }
    stream.set('tempChannelId', endedSong.channelId)
    const videoInfo = await this.youtubeInfoService.getSongsByChannelId(
      stream.tempChannelId,
      stream.nextPage
    )
    const { nextPageToken, items } = videoInfo
    stream.set('nextPage', nextPageToken)
    const rand = RNG(items.length)
    const songMetadata = await this.youtubeInfoService.getInfoIds(items[rand].id.videoId)

    this.pushToQueue({
      queue: stream.queue,
      data: songMetadata,
      requester: endedSong.requester,
      next: false,
      type: 'youtube',
    })

    this.playMusic(stream)
  }

  getNowPlayingData(message: Message, ...otherargs) // override definition
  @AccessController()
  public async getNowPlayingData(
    message: Message,
    @MusicParam('STREAM') stream: MusicStream,
    @MusicParam('CLIENT') member: GuildMember
  ): Promise<void> {
    if (stream.queue.isEmpty) {
      this.sendMessage(message, `**Nothing is playing!**`)
      return
    }
    const currSong = stream.queue.at(0)
    const streamingTime = Math.round((stream?.streamDispatcher?.streamTime || 0) / 1000)
    const content = `**\`${timeConverter(streamingTime)}\`𝗹${createProgressBar(
      streamingTime,
      currSong.duration
    )}𝗹\`${timeConverter(currSong.duration)}\`**\n__\`Channel\`__: **\`${currSong.channelTitle}\`**`
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
    @MusicParam('STREAM') stream?: MusicStream
  ): Promise<void> {
    // stream = stream!
    if (stream?.queue?.isEmpty) {
      this.sendMessage(message, `**Nothing in queue!**`)
      return
    }
    const songsInQueue = stream.queue.length - 1 // exclude now playing
    const limit = 10
    const tabs = Math.ceil(songsInQueue / limit) || 1
    const firstArg = (args.length && Number(args.shift().toLowerCase())) || 1
    if (firstArg > tabs) {
      this.sendMessage(
        message,
        'Index out of range! Please choose a valid one, use `>queue` for checking.'
      )
      return
    }
    if (firstArg === 1) {
      const nowPlaying = stream.queue.first
      let data = `**__NOW PLAYING:__\n\`🎶\`${nowPlaying.title}\`🎶\`** - \`(${await timeConverter(
        nowPlaying.duration
      )})\`\n*Requested by \`${nowPlaying.requester}\`*\n\n`
      const start = 1
      const end = songsInQueue <= 10 ? songsInQueue : limit
      if (songsInQueue > 1) {
        data += `**__QUEUE LIST:__**\n
          ${await printQueueList(stream.queue, start, end)}
          ${songsInQueue > 11 ? `\`And another ${songsInQueue - limit - 1} songs.\`` : ``}\n`
      }
      data += `**${stream.name}'s** total queue duration: \`${await this.getQueueLength(
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
      const endPos = startPosition + limit - 1
      const endPosition = endPos > songsInQueue ? songsInQueue : endPos
      const data = `**__QUEUE LIST:__**\n${await printQueueList(
        stream.queue,
        startPosition,
        endPosition
      )}**${stream.name}'s** total queue duration: \`${await this.getQueueLength(
        stream
      )}\` -- Tab: \`${firstArg}/${tabs}\``
      this.sendMessage(
        message,
        await discordRichEmbedConstructor({
          description: data,
        })
      )
    }
  }

  private async getQueueLength(stream: MusicStream): Promise<string | number> {
    if (stream.isLooping) return STREAM_STATUS.LOOPING
    if (stream.isQueueLooping) return STREAM_STATUS.QUEUE_LOOPING
    return await timeConverter(await stream.queue.totalDuration)
  }
  public async removeSongs(message: Message, args: Array<string>, ...otherArgs)
  @AccessController()
  public async removeSongs(
    message: Message,
    args: string[],
    @MusicParam('STREAM') stream: MusicStream
  ) {
    if (!args.length) {
      this.sendMessage(message, '*Please choose certain song(s) from QUEUE to remove.*')
      return
    }
    const { length, [0]: arg1 = undefined, [1]: arg2 = undefined } = args || []
    const firstValue = +arg1
    if (Number.isNaN(firstValue)) {
      if (arg1 !== 'last') return this.sendMessage(message, 'Invailid option! Action aborted.')
      else {
        if (stream.queue.length === 1) return this.skipSongs(message, args)
        else {
          const removed = stream.queue.removeLast()
          return this.sendMessage(message, `**\`${removed}\` has been removed from QUEUE!**`)
        }
      }
    }
    const { length: queueLength } = stream.queue
    if (length === 1) {
      if (firstValue < 0 || firstValue > stream.queue.length) {
        return this.sendMessage(
          message,
          `Index out of range! Please choose a valid one, use \`>queue\` for checking.`
        )
      }
      if (firstValue === 0) return this.skipSongs(message, args)
      else {
        const { [0]: song } = stream.queue.removeSongs(firstValue) || []
        return (
          song && this.sendMessage(message, `**\`${song.title}\` has been removed from QUEUE!**`)
        )
      }
    } else if (length === 2) {
      const secondValue = +arg2
      if (Number.isNaN(secondValue)) {
        return this.sendMessage(message, 'Invailid option! Action aborted.')
      }

      if (firstValue < 0 || firstValue > queueLength || firstValue + secondValue > queueLength) {
        return this.sendMessage(
          message,
          'Index out of range! Please choose a valid one, use `>queue` for checking.'
        )
      }
      if (firstValue === 0) return this.skipSongs(message, [`${secondValue}`])
      stream.queue.removeSongs(firstValue, secondValue)
      return this.sendMessage(
        message,
        `**Songs from number ${firstValue} to ${firstValue + secondValue - 1} removed from QUEUE!**`
      )
    }
  }

  @AccessController({ join: true, silent: true })
  public async searchSong(message: Message, args: string[]) {
    const searchQuery = args.join(' ')
    const result = await this.youtubeInfoService
      .searchByQuery(searchQuery)
      .catch((err) => this.handleError(err))

    const { items } = result

    let tableContent = '**```css\n'
    items.map((item, index) => {
      tableContent += `#${index + 1}: ${item.snippet.title.replace('&amp;', '&')}\n\n`
    })
    tableContent += '```**'
    const embed = discordRichEmbedConstructor({
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
    const collector = message.channel.createMessageCollector(collectorFilter, collectorOptions)

    collector.on('collect', async (collected: Message) => {
      collector.stop()
      const content = collected.content.match(/[\d]{1,2}|[\w]+/)[0]
      if (content === 'cancel') {
        this.deleteMessage(sentContent)
        return this.sendMessage(message, '**`Canceled!`**')
      } else {
        const index = +content
        if (!isNaN(index) && index > 0 && index <= 10) {
          this.deleteMessage(sentContent)
          const args = [items[index - 1].id.videoId]
          this.play(message, args, false)
        } else {
          this.sendMessage(message, 'Invailid option! Action aborted.')
          sentContent.delete().catch((err) => this.handleError(err))
        }
      }
    })
    collector.on('end', (collected, reason) => {
      console.log(reason, `<======= reason [music.service.ts - 817]`)
      if (sentContent) this.deleteMessage(sentContent)
      if (collected.size < 1) this.sendMessage(message, ':ok_hand: Action aborted.')
    })
  }

  shuffleQueue(message: Message, ...otherArgs)
  @AccessController()
  public shuffleQueue(message: Message, @MusicParam('STREAM') stream: MusicStream): void {
    if (!stream.queue.isEmpty) {
      stream.queue.shuffle()
      this.sendMessage(message, ':twisted_rightwards_arrows: **QUEUE shuffled!**')
    } else {
      this.sendMessage(message, "I'm not playing anything!")
    }
  }

  clearQueue(message: Message, ...otherArgs)
  @AccessController()
  public clearQueue(message: Message, @MusicParam('STREAM') stream: MusicStream): void {
    if (!stream.queue.isEmpty) {
      stream.queue.clearQueue()
      this.sendMessage(message, ':x: **Queue cleared!**')
    } else {
      this.sendMessage(message, '**Queue is empty.**')
    }
  }

  public loopSettings(message: Message, args: string[], ...otherArgs)
  @AccessController()
  public loopSettings(message: Message, args: string[], @MusicParam('STREAM') stream: MusicStream) {
    if (!stream) return this.handleError('Undefined stream value')

    const firstArg = (args.length && args.shift().toLowerCase()) || null

    if (!firstArg) {
      if (!stream.isLooping) {
        stream.set('isLooping', true)
        this.sendMessage(message, ' :repeat: _**Loop enabled!**_')
      } else {
        stream.set('isLooping', false)
        this.sendMessage(message, ' :twisted_rightwards_arrows: _**Loop disabled!**_')
      }
    } else if (firstArg === 'queue') {
      if (!stream.isQueueLooping) {
        stream.set('isQueueLooping', true)
        this.sendMessage(message, ' :repeat: _**Queue loop enabled!**_')
      } else {
        stream.set('isQueueLooping', false)
        this.sendMessage(message, ' :twisted_rightwards_arrows: _**Queue loop disabled!**_')
      }
    } else {
      this.sendMessage(message, `**I'm sorry but what do you mean by \`${firstArg}\` ?**`)
    }
  }

  @AccessController()
  public musicController(
    message: Message,
    isPause: boolean,
    @MusicParam('STREAM') stream?: MusicStream
  ): void {
    if (!stream) {
      this.handleError(new Error('Undefined stream value'))
      return
    }
    if (stream.streamDispatcher) {
      return isPause ? this.setPause(stream) : this.setResume(stream)
    } else {
      this.sendMessage(message, "I'm not playing anything.")
    }
  }

  private setPause(stream: MusicStream) {
    if (!stream.isPaused) {
      stream.streamDispatcher.pause()
      stream.set('isPaused', true)
      this.sendMessageChannel(stream, ':pause_button: **Paused!**')
    } else {
      this.sendMessageChannel(stream, '*Currently paused!*')
    }
  }

  private setResume(stream: MusicStream) {
    if (stream.isPaused) {
      stream.streamDispatcher.resume()
      stream.set('isPaused', false)
      this.sendMessageChannel(stream, ' :arrow_forward: **Continue playing~!**')
    } else {
      this.sendMessageChannel(stream, '*Currently playing!*')
    }
  }

  public resetStreamStatus(stream: MusicStream): void {
    stream?.reset()
  }

  @AccessController()
  public stopPlaying(message: Message, @MusicParam('STREAM') stream?: MusicStream): void {
    if (stream?.isPlaying) {
      stream.queue.deleteQueue()
      this.resetStreamStatus(stream)
      this.sendMessage(message, '**Stopped!**')
    } else {
      this.sendMessage(message, '**Nothing is playing!**')
    }
  }

  public deleteStream(stream: MusicStream): void {
    stream.set('boundTextChannel', null)
    stream.set('boundVoiceChannel', null)
    this.streams.delete(stream.id)
  }

  leaveVoiceChannel(message: Message, isError?: boolean, ...args)
  @AccessController({ silent: true })
  public async leaveVoiceChannel(
    message: Message,
    isError = false,
    @MusicParam('STREAM') stream: MusicStream
  ): Promise<void> {
    if (!stream) return this.handleError('Stream not found!')

    stream.boundVoiceChannel?.leave()

    this.resetStreamStatus(stream)
    this.deleteStream(stream)

    if (!isError) this.sendMessage(message, '**_Bye bye~! Matta nee~!_**')
  }

  public async sendMessage(message: Message, content: string | MessageEmbed): Promise<Message> {
    return await message.channel.send(content).catch((err) => this.handleError(err))
  }

  private async sendMessageChannel(
    stream: MusicStream,
    content: string | MessageEmbed
  ): Promise<Message> {
    return await stream.boundTextChannel.send(content).catch((err) => this.handleError(err))
  }

  public async replyMessage(message: Message, content: string | MessageEmbed) {
    return await message.reply(content).catch((error) => this.handleError(error))
  }

  public async deleteMessage(message: Message, option: { timeout?: number; reason?: string } = {}) {
    return await message.delete(option).catch((err) => this.handleError(err))
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, MusicService.name)
    return null
  }
}
