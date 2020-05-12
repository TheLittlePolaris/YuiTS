import getYoutubeID from 'get-youtube-id'
import { isYoutubeUrl } from './youtube-utilities'
import { errorLogger } from '@/handlers/log.handler'
import { YoutubeRequestService } from './youtube-request.service'
import {
  IYoutubePlaylistResult,
  IYoutubeVideo,
  IYoutubeSearchResult,
} from '../music-interfaces/youtube-info.interface'

export abstract class YoutubeInfoService {
  public static async getVideoId(query: string): Promise<string> {
    if (isYoutubeUrl(query)) {
      return Promise.resolve(getYoutubeID(query))
    } else {
      return await this.searchVideo(query)
    }
  }

  public static getPlaylistID(url: string): Promise<string> {
    return new Promise((resolve, _) => {
      const isPlaylist: string = url.match(/[&|\?]list=([a-zA-Z0-9_-]+)/i)[1]
      resolve(isPlaylist)
    })
  }

  public static async getPlaylistId(args) {
    if (!isYoutubeUrl(args)) {
      throw new Error('Argument is not a youtube link.')
    } else {
      return await this.getPlaylistID(args)
    }
  }

  public static async searchVideo(query: string): Promise<string> {
    // todo: add error notice when fail
    const data: IYoutubeSearchResult = await YoutubeRequestService.googleYoutubeApiSearch(
      {
        part: 'snippet',
        maxResults: 10,
        q: query,
        type: 'video',
        fields: 'items(id(kind,videoId),snippet(channelId,channelTitle,title))',
      }
    )
    if (!data) throw Error('Something went wrong during request')

    return data?.items[0]?.id?.videoId || '3uOWvcFLUY0' // default
  }

  public static async getInfoIds(ids: string): Promise<IYoutubeVideo[]> {
    const data = await YoutubeRequestService.googleYoutubeApiVideos({
      part: 'snippet, contentDetails',
      id: ids,
      fields:
        'items(contentDetails/duration,id,snippet(channelId,channelTitle,thumbnails/default,title))',
    })

    return data.items
  }

  public static async getPlaylistItems(
    playlistId: string,
    currentPageToken?: string
  ): Promise<IYoutubeVideo[]> {
    const data = await YoutubeRequestService.googleYoutubeApiPlaylistItems({
      part: 'snippet',
      playlistId,
      fields:
        'nextPageToken,items(id,kind,snippet(channelId,channelTitle,resourceId(kind,videoId),title))',
      ...(currentPageToken ? { pageToken: currentPageToken } : {}),
    })
    if (!data) return []
    const { nextPageToken } = data
    const playlistSongs = await this.processPlaylistItemsData(
      data
    ).catch((err) => this.handleError(new Error(err)))
    let nextPageResults = []
    if (nextPageToken) {
      nextPageResults = await this.getPlaylistItems(
        playlistId,
        nextPageToken
      ).catch((err) => this.handleError(new Error(err)))
    }
    return [...playlistSongs, ...(nextPageResults || [])]
  }

  static processPlaylistItemsData(
    data: IYoutubePlaylistResult
  ): Promise<IYoutubeVideo[]> {
    return new Promise(async (resolve, _) => {
      const tmpIdsArray: Array<string> = []
      await Promise.all(
        data.items.map((song) => {
          return tmpIdsArray.push(song.snippet.resourceId.videoId)
        })
      ).catch(this.handleError)

      const videos = await this.getInfoIds(tmpIdsArray.join(',')).catch(
        this.handleError
      )
      resolve(videos)
    })
  }

  public static async getSongsByChannelId(
    channelId: string,
    pageToken?: string
  ): Promise<IYoutubeSearchResult> {
    const data = await YoutubeRequestService.googleYoutubeApiSearch({
      part: 'snippet',
      channelId,
      type: 'video',
      fields: 'nextPageToken,items(id(videoId))',
      ...(pageToken ? { pageToken } : {}),
    })
    return data
  }

  public static async searchByQuery(
    query: string
  ): Promise<IYoutubeSearchResult> {
    const data = await YoutubeRequestService.googleYoutubeApiSearch({
      part: 'snippet',
      maxResults: 10,
      q: query,
      type: 'video',
      fields: 'items(id,kind,snippet(channelId,channelTitle,title))',
    })
    return data
  }

  static handleError(error: string | Error): null {
    return errorLogger(error, 'YOUTUBE_SERVICE')
  }
}
