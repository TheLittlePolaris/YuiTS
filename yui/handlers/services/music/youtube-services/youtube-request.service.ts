import request from 'request'
import { youtube_v3, google } from 'googleapis'
import { errorLogger } from '@/handlers/log.handler'
import {
  IYoutubeSearchResult,
  IYoutubePlaylistItem,
  IYoutubeVideosResult,
} from '../music-entities/interfaces/youtube-song-metadata.interface'

export abstract class YoutubeRequestService {
  static youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: global.config.youtubeApiKey,
  })
  static youtubeSearch: youtube_v3.Resource$Search =
    YoutubeRequestService.youtube.search
  static youtubeVideos: youtube_v3.Resource$Videos =
    YoutubeRequestService.youtube.videos
  static youtubePlayListItems: youtube_v3.Resource$Playlistitems =
    YoutubeRequestService.youtube.playlistItems

  public static youtubeApiRequest<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request(
        `${url}&key=${global?.config?.youtubeApiKey}`,
        (err: string, _, body: string | JSON) => {
          if (err) {
            this.handleRequestErrors(err)
            reject('Something went wrong')
          }
          const json = typeof body === 'string' ? JSON.parse(body) : body
          console.log(json, ' <===== REQUESTTTTT JSONNNNNNNNN')
          const { error, items } = json
          if (error || !items) {
            this.handleRequestErrors(error)
            resolve(null)
          }
          resolve(json)
        }
      )
    })
  }

  public static async googleYoutubeApiSearch(
    options: youtube_v3.Params$Resource$Search$List
  ): Promise<IYoutubeSearchResult> {
    const { data, status } = await this.youtubeSearch.list(options)
    if (status !== 200 || !data.items)
      throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  public static async googleYoutubeApiVideos(
    options: youtube_v3.Params$Resource$Videos$List
  ): Promise<IYoutubeVideosResult> {
    const { data, status } = await this.youtubeVideos.list(options)
    if (status !== 200 || !data.items)
      throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  public static async googleYoutubeApiPlaylistItems(
    options: youtube_v3.Params$Resource$Playlistitems$List
  ) {
    const { data, status } = await this.youtubePlayListItems.list(options)
    if (status !== 200 || !data.items)
      throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  static handleRequestErrors(error: string): null {
    return errorLogger(error, 'YOUTUBE_REQUEST_SERVICE')
  }
}
