import { youtube_v3, google } from 'googleapis'
import {
  IYoutubeSearchResult,
  IYoutubeVideosResult,
  IYoutubePlaylistResult
} from '../interfaces/youtube-info.interface'
import { Injectable } from 'djs-ioc-container'
import { YuiLogger } from '@/logger/logger.service'
import { ConfigService } from '@/config-service/config.service'

@Injectable()
export class YoutubeRequestService {
  youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: this.configService.youtubeApiKey
  })

  youtubeSearch: youtube_v3.Resource$Search = this.youtube.search
  youtubeVideos: youtube_v3.Resource$Videos = this.youtube.videos
  youtubePlayListItems: youtube_v3.Resource$Playlistitems = this.youtube.playlistItems

  constructor(private configService: ConfigService) {}

  public async googleYoutubeApiSearch(
    options: youtube_v3.Params$Resource$Search$List
  ): Promise<IYoutubeSearchResult> {
    const { data, status } = await this.youtubeSearch.list(options)
    if (status !== 200 || !data.items) throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  public async googleYoutubeApiVideos(
    options: youtube_v3.Params$Resource$Videos$List
  ): Promise<IYoutubeVideosResult> {
    const { data, status } = await this.youtubeVideos.list(options)
    if (status !== 200 || !data.items) throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  public async googleYoutubeApiPlaylistItems(
    options: youtube_v3.Params$Resource$Playlistitems$List
  ): Promise<IYoutubePlaylistResult> {
    const { data, status } = await this.youtubePlayListItems.list(options)
    if (status !== 200 || !data.items) throw new Error('Youtube Request Failed: ' + data)
    return data
  }

  handleRequestErrors(error: string): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
