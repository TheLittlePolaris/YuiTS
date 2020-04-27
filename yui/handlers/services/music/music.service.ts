import {
  Message,
  TextChannel,
  StreamOptions,
  MessageEmbed,
  MessageCollectorOptions,
  GuildMember,
  Client,
  StreamDispatcher,
  BroadcastDispatcher,
} from 'discord.js'
import { MusicStream } from './music-entities/music-stream'
import {
  RNG,
  timeConverter,
  isYoutubeLink,
  printQueueList,
  createProgressBar,
  youtubeTimeConverter,
  STREAM_STATUS,
} from './music-utilities/music-function'
import { MusicQueue } from './music-entities/music-queue'
import { ISong } from './music-entities/interfaces/song-metadata.interface'
import { discordRichEmbedConstructor } from './music-utilities/discord-embed-constructor'
import ytdl from 'ytdl-core'
// import discordYtdl from 'ytdl-core-discord'
import { Constants } from '@/constants/constants'
import { IVoiceConnection } from '@/interfaces/custom-interfaces.interface'
import { errorLogger, debugLogger } from '@/handlers/log.handler'
import {
  MusicServiceInitiator,
  AccessController,
  GuildStream,
  CurrentGuildMember,
} from '@/decorators/music.decorator'
import { YoutubeInfoService } from './youtube-services/youtube-info.service'
import { IYoutubePlaylistItem } from './music-entities/interfaces/youtube-song-metadata.interface'
import { Readable } from 'stream'

// TODO: NEED TO FIX SOME LOGIC

@MusicServiceInitiator()
export class MusicService {
  _streams: Map<string, MusicStream>
  constructor() {
    debugLogger('MusicService')
  }

  async createStream(
    message: Message,
    client: Client
  ): Promise<MusicStream | null> {
    const sentMessage: Message = (await message.channel.send(
      ':hourglass_flowing_sand: **_Preparing, just one moment! ;)_**'
    )) as Message
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
            stream.boundTextChannel.send(
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

  async createVoiceConnection(
    message: Message,
    stream: MusicStream,
    client: Client
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
    @GuildStream() stream?: MusicStream,
    @CurrentGuildMember() member?: GuildMember
  ): Promise<void> {
    stream =
      stream ??
      (await this.createStream(message, member.client).catch((err) =>
        this.handleError(new Error(err))
      ))
    if (!stream) {
      message.channel.send(
        'Something went wrong. Could not create the stream. Please try again!'
      )
      this.handleError(new Error('Guild stream was not created.'))
    }

    const _arguments: string = args.join(' ')
    if (isYoutubeLink(_arguments) && _arguments.indexOf('list=') > -1) {
      return this.queuePlaylist(stream, message, _arguments)
    } else {
      return await this.queueSong(stream, message, _arguments)
    }
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
      message.channel.send(' :loudspeaker: Kawaii **Yui-chan** is here~! xD')
    else {
      try {
        const stream = this._streams.get(message?.guild?.id)
        if (stream) this.leaveVoiceChannel(message, true)
      } catch (err) {
        this.handleError(new Error(err))
      }
      message.channel.send(
        '**Connection could not be established. Please try again.**'
      )
    }
  }

  public async queuePlaylist(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    try {
      const youtubePlaylistId = await YoutubeInfoService.getPlaylistId(
        args
      ).catch((err) => this.handleError(new Error(err)))

      if (!!youtubePlaylistId) {
        const sentMessage: Message = (await stream.boundTextChannel
          .send(
            ':hourglass_flowing_sand: **_Loading playlist, please wait..._**'
          )
          .catch((err) => this.handleError(new Error(err)))) as Message
        const requester = message.member.displayName
        const playList = await YoutubeInfoService.getPlaylistItems(
          youtubePlaylistId
        ).catch((err) => this.handleError(new Error(err)))

        if (!playList) {
          stream.boundTextChannel.send('Something went wrong!')
          throw new Error(`Couldn't load the playlist`)
        }

        const nAdded = playList?.length

        await Promise.all([
          this.pushToQueue(
            stream.queue,
            playList,
            requester,
            true
          ).catch((err) => this.handleError(new Error(err))),
          sentMessage
            .edit(`:white_check_mark: **Enqueued ${nAdded} songs!**`)
            .catch((err) => this.handleError(new Error(err))),
        ])

        if (stream.isPlaying === false) {
          stream.set('isPlaying', true)

          await this.playMusic(stream)

          stream.boundTextChannel
            .send('**`🎶 Playlist starting - NOW! 🎶`**')
            .catch((err) => this.handleError(new Error(err)))
        }
      }
    } catch (error) {
      stream.boundTextChannel
        .send("Sorry, something went wrong and i couldn't get the playlist.")
        .catch((err) => this.handleError(new Error(err)))
      return this.handleError(error as Error)
    }
  }

  public async queueSong(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    // console.log("Enter queue song. Start enqueuing... ");
    let requester: string = message.member.displayName
    let queue: MusicQueue = stream.queue
    let tempStatus: string
    const videoId = await YoutubeInfoService.getID(args)
    const itemInfo = await YoutubeInfoService.getInfoIds(videoId)
    await Promise.all([this.pushToQueue(queue, itemInfo, requester, true)])
    if (!stream.isPlaying) {
      stream.set('isPlaying', true)
      this.playMusic(stream)
      tempStatus = '♫ Now Playing ♫'
      // console.log("isPlaying === ", stream.isPlaying);
    } else tempStatus = '♬ Added To QUEUE ♬'
    var nowPlayingDescription = `*\`Channel\`*: **\`${
      queue.last.channelTitle
    }\`**\n*\`Duration\`*: **\`${await timeConverter(queue.last.duration)}\`**${
      queue.length === 1
        ? ``
        : `\n*\`Position in queue\`*: **\`${queue.length - 1}\`**`
    }`

    try {
      const embed = await discordRichEmbedConstructor({
        title: queue.last.title,
        author: {
          embedTitle: tempStatus,
          authorAvatarUrl: message.author.avatarURL(),
        },
        description: nowPlayingDescription,
        color: Constants.YUI_COLOR_CODE,
        thumbnailUrl: queue.last.videoThumbnail,
        appendTimeStamp: true,
        titleUrl: queue.last.videoUrl,
        footer: `Requested by ${requester}`,
      })

      await stream.boundTextChannel.send({ embed })
    } catch (err) {
      errorLogger(err)
    }
  }

  public pushToQueue(
    queue: MusicQueue,
    data: IYoutubePlaylistItem[],
    requester: string,
    atEnd: boolean
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!data || !data.length) {
        this.handleError(new Error('No data was supplied'))
        reject(false)
      } else {
        const promises = data.map(async (_song: IYoutubePlaylistItem) => {
          if (!_song.id) {
            return this.handleError(new Error('Song id was undefined.'))
          }
          const song: ISong = {
            id: _song.id,
            title: _song.snippet.title,
            channelId: _song.snippet.channelId,
            channelTitle: _song.snippet.channelTitle,
            duration: await youtubeTimeConverter(_song.contentDetails.duration),
            requester,
            videoUrl: `https://www.youtube.com/watch?v=${_song.id}`,
            videoThumbnail: _song.snippet.thumbnails.default.url,
          }
          const added = atEnd ? queue.addSong(song) : queue.addNext(song)
          return true
        })
        await Promise.all(promises)
        resolve(true)
      }
    })
  }

  async playMusic(stream: MusicStream): Promise<void> {
    try {
      const currSong = stream.queue.at(0)

      const downloadOptions: ytdl.downloadOptions = {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25,
        liveBuffer: 40000,
      }

      const ytdlStream = ytdl(
        `https://www.youtube.com/watch?v=${currSong.id}`,
        downloadOptions
      )

      const streamOptions: StreamOptions = {
        volume: 0.7,
        highWaterMark: 50,
      }

      // const streamDispatcher = this.playStream(stream, ytdlStream, streamOptions)

      const streamDispatcher = this.playStream(
        stream,
        ytdlStream,
        streamOptions
      )

      let sent: Message
      stream.streamDispatcher.on('start', async () => {
        stream.voiceConnection.player.streamingData.pausedTime = 0
        if (!stream.isLooping) {
          sent = (await stream.boundTextChannel
            .send('**` 🎧 Now Playing: ' + stream.queue.at(0).title + '`**')
            .catch((err) => this.handleError(new Error(err)))) as Message
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
        ytdlStream.destroy()

        if (error) {
          this.handleError(new Error(error as string))
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
            delete stream._streamDispatcher
            return this.resetStreamStatus(stream)
          } else {
            return this.autoPlaySong(stream, endedSong)
          }
        }

        return this.playMusic(stream)
      }

      // ytdl error ?
      // ytdlStream.on('error', (error) => onStreamEnd({ error }))

      // stream dispatcher error
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

  @AccessController({ join: true, silent: true })
  public async addToNext(
    message: Message,
    args?: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    if (!stream) return this.play(message, args)
    const queue = stream.queue
    if (!stream.isPlaying || queue.isEmpty) {
      return this.play(message, args)
    } else {
      const _arguments = args.join(' ')
      if (isYoutubeLink(_arguments) && _arguments.indexOf('list=') > -1) {
        await stream.boundTextChannel.send(
          'Currently cannot add playlist to next. Use `>play` instead.'
        )
        return
      }
      var requester = message.member.displayName
      const songId = await YoutubeInfoService.getID(_arguments).catch(
        this.handleError
      )
      const song = await YoutubeInfoService.getInfoIds(songId).catch(
        this.handleError
      )
      const createdSong = await this.pushToQueue(
        queue,
        song,
        requester,
        false
      ).catch((err) => this.handleError(new Error(err)))
      if (createdSong) {
        const description = `*\`Channel\`*: **\`${
          queue.at(1).channelTitle
        }\`**\n*\`Duration\`*: **\`${await timeConverter(
          queue.at(1).duration
        )}\`**\n*\`Position in queue\`*: **\`1\`**`
        const embed = await discordRichEmbedConstructor({
          title: queue.at(0).title,
          author: {
            embedTitle: '♬ Added Next ♬',
            authorAvatarUrl: message.author.avatarURL(),
          },
          description,
          thumbnailUrl: queue.at(1).videoThumbnail,
          appendTimeStamp: true,
          color: Constants.YUI_COLOR_CODE,
          titleUrl: queue.at(1).videoUrl,
          footer: `Requested by ${requester}`,
        })
        this.sendMessage(message, embed)
      }
    }
  }

  @AccessController()
  public async skipSongs(
    message: Message,
    args?: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (stream.queue.isEmpty) {
      await this.sendMessage(message, '**__Nothing to skip...__**')
      return
    } else {
      switch (args.length) {
        case 0: {
          if (stream.isLooping) {
            stream.set('isLooping', false)
          }
          if (!!stream.streamDispatcher) {
            stream.boundTextChannel.send(' :fast_forward: **Skipped!**')
            stream.streamDispatcher.end()
            return
          }
          break
        }
        case 1: {
          if (!isNaN(args[0] as any)) {
            let skipAmount = Number(args[0])
            if (skipAmount < 0 || skipAmount > stream.queue.length) {
              await this.sendMessage(
                message,
                'Index out of range! Please choose a valid one, use `>queue` for checking.'
              )
              return
            }
            stream.queue.spliceSongs(1, skipAmount)
            if (stream.isLooping) {
              stream.set('isLooping', false)
            }
            if (stream.streamDispatcher) {
              stream.boundTextChannel.send(
                ` :fast_forward: **Skipped ${skipAmount} songs!**`
              )
              stream.streamDispatcher.end()
              return
            }
          } else {
            this.sendMessage(message, 'Please enter a number!')
            return
          }
          break
        }
        default:
          break
      }
    }
  }

  @AccessController({ join: false, silent: true })
  public async setVolume(
    message: Message,
    args: Array<string>,
    @GuildStream() stream?: MusicStream
  ) {
    if (!args?.length) {
      message.channel.send('**Please enter a value!**')
    }

    const newVolume = Number(args[0])

    if (!Number.isNaN(newVolume) && newVolume < 0 && newVolume > 100) {
      message.channel
        .send('**Please enter a valid number! (0 <= volume <= 100)**')
        .catch((err) => this.handleError(new Error(err)))
    }

    const currentVolume = stream.streamDispatcher.volume

    stream.streamDispatcher.setVolume(newVolume / 100)

    message.channel
      .send(
        `**Volume ${
          currentVolume < newVolume ? `incleased` : `decreased`
        } from ${currentVolume * 100} to ${newVolume}**`
      )
      .catch((err) => this.handleError(new Error(err)))
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
      this.pushToQueue(stream.queue, songMetadata, endedSong.requester, false),
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
        embedTitle: '♫ Now Playing ♫',
        authorAvatarUrl: member.user.avatarURL(),
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
    if (
      (!!args[0] && isNaN(args[0] as any)) ||
      (!isNaN(args[0] as any) && Number(args[0]) > tabs)
    ) {
      await this.sendMessage(
        message,
        'Index out of range! Please choose a valid one, use `>queue` for checking.'
      )
      return
    } else if (!args[0] || (!isNaN(args[0] as any) && Number(args[0]) === 1)) {
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
          \`${
            numberOfSongs > 10 ? `And another ${numberOfSongs - 11} songs.` : ``
          }\`\n`
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
      const selectedTab = Number(args[0])
      const startPosition = (selectedTab - 1) * limit + 1
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
      )}\` -- Tab: \`${selectedTab}/${tabs}\``
      stream.boundTextChannel.send(
        await discordRichEmbedConstructor({
          description: data,
        })
      )
    }
    return
  }

  async getQueueLength(stream: MusicStream) {
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
    switch (args.length) {
      case 0: {
        this.sendMessage(
          message,
          '*Please choose certain song(s) from QUEUE to remove.*'
        )
        return
      }
      case 1: {
        if (isNaN(args[0] as any)) {
          if (args[0] === 'last') {
            if (stream.queue.length === 1)
              return await this.skipSongs(message, args)
            else
              this.sendMessage(
                message,
                `**\`${stream.queue.popLast()}\` has been removed from QUEUE!**`
              )
          } else {
            this.sendMessage(message, 'Invailid option! Action aborted.')
          }
          return
        } else {
          const index = Number(args[0])
          if (index < 0 || index > stream.queue.length) {
            stream.boundTextChannel.send(
              `Index out of range! Please choose a valid one, use \`>queue\` for checking.`
            )
          } else if (index === 0) {
            return await this.skipSongs(message, args)
          } else {
            this.sendMessage(
              message,
              `**\`${stream.queue.spliceSong(
                index
              )}\` has been removed from QUEUE!**`
            )
          }
        }
        break
      }
      case 2: {
        if (isNaN(args[0] as any) || isNaN(args[1] as any)) {
          this.sendMessage(message, 'Invailid option! Action aborted.')
          return
        } else {
          const startPosition = Number(args[0])
          const amount = Number(args[1])
          if (
            startPosition < 1 ||
            startPosition > stream.queue.length ||
            amount > stream.queue.length - startPosition
          ) {
            this.sendMessage(
              message,
              'Index out of range! Please choose a valid one, use `>queue` for checking.'
            )
            return
          }
          stream.queue.spliceSongs(startPosition, amount)
          this.sendMessage(
            message,
            `**Songs from number ${startPosition} to ${
              startPosition + amount - 1
            } removed from QUEUE!**`
          )
        }
        break
      }
    }
    return
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
    for (let i = 0; i < items.length; i++) {
      tableContent += `#${i + 1} -- ${items[i].snippet.title.replace(
        '&amp;',
        '&'
      )}\n`
    }
    tableContent += '```**'
    const embed = await discordRichEmbedConstructor({
      title: `**Pick one option from the list below, or type \`cancel\` to abort.**`,
      description: tableContent,
    })

    const sentContent = (await this.sendMessage(message, embed).catch((err) =>
      this.handleError(new Error(err))
    )) as Message

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
          const args = Array(0).concat([items[index - 1].id.videoId])
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
    return
  }

  @AccessController()
  public async loopSettings(
    message: Message,
    args: Array<string>,
    @GuildStream() stream?: MusicStream
  ): Promise<void> {
    stream = stream!
    if (!stream) {
      this.handleError(new Error('`guild` was undefined'))
      return
    }
    if (!args[0]) {
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
      return
    } else if (args[0].toLowerCase() === 'queue') {
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
      return
    } else {
      this.sendMessage(message, 'Invailid option, action aborted!')
    }
    return
  }

  @AccessController()
  public async musicController(
    message: Message,
    isPause: boolean,
    @GuildStream() stream?: MusicStream
  ) {
    stream = stream!
    if (!stream) {
      this.handleError(new Error('`guild` was undefined'))
      return
    }
    if (stream.streamDispatcher) {
      isPause ? this.setPause(stream) : this.setResume(stream)
      return
    } else {
      stream.boundTextChannel.send("I'm not playing anything.")
    }
    return
  }
  private setPause(stream: MusicStream): Promise<void> {
    if (!stream.isPaused) {
      stream.streamDispatcher.pause()
      stream.set('isPaused', true)
      stream.boundTextChannel.send(' :pause_button: **Paused!**')
    } else {
      stream.boundTextChannel.send('*Currently paused!*')
    }
    return
  }
  private setResume(stream: MusicStream): Promise<void> {
    if (stream.isPaused) {
      stream.streamDispatcher.pause()
      stream.set('isPaused', false)
      stream.boundTextChannel.send(' :arrow_forward: **Continue playing~!**')
    } else {
      stream.boundTextChannel.send('*Currently playing!*')
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
  public async stopPlaying(message: Message) {
    const stream = this._streams.get(message.guild.id)
    if (stream.isPlaying) {
      stream.queue.deleteQueue()
      await this.resetStreamStatus(stream)
      this.sendMessage(message, '**Stopped!**')
    } else {
      this.sendMessage(message, '**Nothing is playing!**')
    }
    return
  }

  public deleteStream(stream: MusicStream) {
    stream.set('boundTextChannel', null)
    stream.set('boundVoiceChannel', null)
    this._streams.delete(stream.id)
  }

  @AccessController({ silent: true })
  public async leaveVoiceChannel(
    message: Message,
    isError: boolean = false
  ): Promise<void> {
    const { guild } = message
    if (!guild?.id)
      return this.handleError(
        new Error('[leaveVoiceChannel] Guild was undefined')
      )
    const stream = this._streams.get(guild.id)
    if (!stream)
      return this.handleError(
        new Error('[leaveVoiceChannel] Stream not found!')
      )

    stream.boundVoiceChannel.leave()

    this.resetStreamStatus(stream)
    this.deleteStream(stream)

    if (!isError)
      this.sendMessage(message, '**_Bye bye~! Matta nee~!_**').catch((err) =>
        this.handleError(new Error(err))
      )
  }

  public sendMessage(
    message: Message,
    content: string | MessageEmbed
  ): Promise<Message | Message[]> {
    return message.channel
      .send(content)
      .catch((err) => this.handleError(new Error(err)))
  }

  public get streams(): Map<string, MusicStream> {
    return this._streams
  }

  public getStreams() {
    return this._streams
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, 'MUSIC_SERVICE')
  }
}
