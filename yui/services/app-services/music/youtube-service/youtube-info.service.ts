/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { YoutubeRequestService } from './youtube-request.service'
import { IYoutubePlaylistResult, IYoutubeVideo, IYoutubeSearchResult } from '../music-interfaces/youtube-info.interface'
import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { YuiLogger } from '@/services/logger/logger.service'

@Injectable()
export class YoutubeInfoService {
  constructor(private youtubeRequestService: YoutubeRequestService) {
    YuiLogger.info(`Created!`, this.constructor.name)
  }

  public getYoutubePlaylistId(query: string) {
    const result = /[&|\?]list=([a-zA-Z0-9_-]+)/gi.exec(query)
    return (result && result.length && result[1]) || null
  }

  public async getYoutubeVideoId(query: string) {
    const result = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/gi.exec(
      query
    )
    return (result?.length && result[1]) || (await this.searchVideo(query))
  }

  public async searchVideo(query: string): Promise<string> {
    // todo: add error notice when fail
    const data: IYoutubeSearchResult = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      maxResults: 10,
      q: query,
      type: ['video'],
      fields: 'items(id(kind,videoId),snippet(channelId,channelTitle,title))',
    })
    if (!data) throw Error('Something went wrong during request')

    return data?.items?.[0]?.id?.videoId || '3uOWvcFLUY0' // default
  }

  public async getInfoIds(...ids: string[]): Promise<IYoutubeVideo[]> {
    const data = await this.youtubeRequestService.googleYoutubeApiVideos({
      part: ['snippet', 'contentDetails'],
      id: ids,
      fields: 'items(contentDetails(duration),id,snippet(channelId,channelTitle,thumbnails/default,title))',
    })
    if (!data) throw Error('Something went wrong during request')
    return data.items
  }

  public async getPlaylistItems(playlistId: string, currentPageToken?: string): Promise<IYoutubeVideo[]> {
    const data = await this.youtubeRequestService.googleYoutubeApiPlaylistItems({
      part: ['snippet'],
      playlistId,
      fields: 'nextPageToken,items(id,kind,snippet(channelId,channelTitle,resourceId(kind,videoId),title))',
      ...(currentPageToken ? { pageToken: currentPageToken } : {}),
      maxResults: 50,
    })
    if (!data) return []
    const { nextPageToken } = data
    const playlistSongs = await this.processPlaylistItemsData(data).catch((err) => this.handleError(new Error(err)))
    let nextPageResults = []
    if (nextPageToken) {
      nextPageResults = await this.getPlaylistItems(playlistId, nextPageToken).catch((err) =>
        this.handleError(new Error(err))
      )
    }
    return [...playlistSongs, ...(nextPageResults || [])]
  }

  async processPlaylistItemsData(data: IYoutubePlaylistResult): Promise<IYoutubeVideo[]> {
    const tmpIdsArray: Array<string> = []
    await Promise.all(
      data.items.map((song) => {
        return tmpIdsArray.push(song.snippet.resourceId.videoId)
      })
    ).catch(this.handleError)

    const videos = await this.getInfoIds(...tmpIdsArray).catch(this.handleError)

    return videos
  }

  public async getSongsByChannelId(channelId: string, pageToken?: string): Promise<IYoutubeSearchResult> {
    const data = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      channelId,
      type: ['video'],
      fields: 'nextPageToken,items(id(videoId))',
      ...(pageToken ? { pageToken } : {}),
    })
    return data
  }

  public async searchByQuery(query: string): Promise<IYoutubeSearchResult> {
    const data = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      maxResults: 10,
      q: query,
      type: ['video'],
      fields: 'items(id,kind,snippet(channelId,channelTitle,title))',
    })
    return data
  }

  handleError(error: string | Error): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
