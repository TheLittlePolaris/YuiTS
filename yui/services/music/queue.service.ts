import { DiscordClient, Injectable } from 'djs-ioc-container'
import { Message } from 'discord.js'
import { sendChannelMessage, italic, bold } from '../utilities'
import { MusicStream } from './entities'
import { IYoutubeVideo, ISong, ISongType, ISongOption } from './interfaces'
import { PolarisSoundCloudService } from './soundcloud-service'
import { STREAM_STATUS, timeConverter } from './utils'
import { YoutubeInfoService, youtubeTimeConverter } from './youtube-service'
import { YuiLogger } from '@/logger/logger.service'

@Injectable()
export class MusicQueueService {
  constructor(
    private readonly youtubeInfoService: YoutubeInfoService,
    private readonly soundcloudService: PolarisSoundCloudService,
    private readonly yui: DiscordClient
  ) {}

  async enqueueSongFromQuery(
    stream: MusicStream,
    args: string,
    options: ISongOption
  ): Promise<ISong> {
    const { type = 'youtube', next, requester } = options
    let data: IYoutubeVideo[]
    if (type === 'youtube') {
      const videoId = await this.youtubeInfoService.getYoutubeVideoId(args)
      if (!videoId) {
        stream.sendMessage(
          bold('Something went wrong while trying to fetch the song from Youtube...')
        )
        return
      }
      data = await this.youtubeInfoService.getVideoMetadata(videoId)
    } else {
      const song = (await this.soundcloudService.getSoundcloudInfoFromUrl(args)) as IYoutubeVideo
      if (!song) {
        stream.sendMessage(
          bold('Something went wrong while trying to fetch the song from Soundcloud...')
        )
        return
      }
      data = [song]
    }

    this.enqueueVideos(stream, data, { requester, next, type })

    return options.next ? stream.queue.firstInQueue : stream.queue.last
  }

  convertToSong(video: IYoutubeVideo, requester: string, type: ISongType = 'youtube'): ISong {
    const {
      id,
      snippet,
      contentDetails,
      videoUrl = `https://www.youtube.com/watch?v=${id}`
    } = video
    const { title, channelId, channelTitle, thumbnails } = snippet
    return {
      id,
      title: title,
      channelId,
      channelTitle,
      duration:
        type === 'youtube'
          ? youtubeTimeConverter(contentDetails.duration)
          : contentDetails.rawDuration,
      requester,
      videoUrl,
      videoThumbnail: thumbnails.default.url,
      type
    }
  }

  private getSongsData(data: IYoutubeVideo[], options: ISongOption) {
    return data.reduce((results: ISong[], video: IYoutubeVideo) => {
      if (video.id) results.push(this.convertToSong(video, options.requester, options.type))
      return results
    }, [])
  }

  enqueueVideos(stream: MusicStream, data: IYoutubeVideo[], options?: ISongOption) {
    if (!data?.length) {
      stream.sendMessage(bold('Songthing went wrong while getting videos data...'))
      return
    }

    const songs = this.getSongsData(data, options)

    if (options.next) stream.queue.pushNext(...songs)
    else stream.queue.push(...songs)
  }

  async loadAutoplayQueue(stream: MusicStream) {
    const { nextPageToken, items } = await this.youtubeInfoService.getRelatedVideos(
      stream.autoplayVideoId,
      stream.nextPage
    )
    stream.set('nextPage', nextPageToken)

    const relatedVideosMetadata = await this.youtubeInfoService.getVideoMetadata(
      ...items.map((i) => i.id.videoId)
    )

    this.importAutoplayQueue(stream, relatedVideosMetadata)
  }

  importAutoplayQueue(stream: MusicStream, data: IYoutubeVideo[]) {
    if (!data?.length)
      return stream.sendMessage(bold('Songthing went wrong while getting video data...'))
    const songs: ISong[] = this.getSongsData(data, {
      requester: this.yui.getDisplayName({ guildId: stream.id }),
      type: 'youtube'
    })
    return stream.importAutoplayQueue(songs)
  }

  async getYoutubePlaylist(message: Message, args: string) {
    const youtubePlaylistId = await this.youtubeInfoService.getYoutubePlaylistId(args)

    let playListVideos: IYoutubeVideo[] = []

    const sentMessage: Message = await sendChannelMessage(
      message,
      ':hourglass_flowing_sand: **_Loading playlist, please wait..._**'
    )
    const requester = message.member.displayName
    if (youtubePlaylistId) {
      playListVideos = await this.youtubeInfoService
        .getPlaylistItems(youtubePlaylistId)
        .catch((err) => this.handleError(err))
    } else {
      const videoId = await this.youtubeInfoService.getYoutubeVideoId(args)
      if (videoId) {
        playListVideos = await this.youtubeInfoService.getVideoMetadata(videoId)
      }
    }

    if (!playListVideos?.length) {
      sendChannelMessage(message, bold('Could not load playlist videos!'))
      throw new Error(`Couldn't load the playlist`)
    }

    return {
      requester,
      sentMessage,
      data: playListVideos
    }
  }

  async getSoundCloudPlaylist(message: Message, playlistLink: string) {
    const sentMessage: Message = await sendChannelMessage(
      message,
      `:hourglass_flowing_sand: ${bold(
        italic('Loading playlist from SoundCloud, this may take some times, please wait...')
      )}`
    )

    const playlistSongs: IYoutubeVideo[] = (await this.soundcloudService.getSoundcloudInfoFromUrl(
      playlistLink,
      {
        getUrl: false
      }
    )) as IYoutubeVideo[] // checked, should be fine

    if (!playlistSongs || !playlistSongs.length) {
      sendChannelMessage(message, bold('Sorry, i could not find any song in that playlist...'))
      return
    }

    return {
      sentMessage,
      data: playlistSongs
    }
  }

  getQueueLength(stream: MusicStream): string | number {
    if (stream.isLooping) return STREAM_STATUS.LOOPING
    if (stream.isQueueLooping) return STREAM_STATUS.QUEUE_LOOPING
    return timeConverter(stream.queue.totalDuration)
  }

  private handleError(error: any) {
    YuiLogger.error(error, this.constructor.name)
    return error
  }
}
