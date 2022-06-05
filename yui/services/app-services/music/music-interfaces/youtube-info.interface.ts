/* eslint-disable @typescript-eslint/no-empty-interface */
import { youtube_v3 } from 'googleapis'
import { IYoutubeDLSoundCloudAudioProtocol } from './soundcloud-info.interface'

// re-map interface name

export interface IYoutubeSearchResult extends youtube_v3.Schema$SearchListResponse {}

export interface IYoutubeVideosResult extends youtube_v3.Schema$VideoListResponse {}

export interface IYoutubePlaylistResult extends youtube_v3.Schema$PlaylistItemListResponse {}

export interface ISoundCloudInfo {
  url: string
  type: IYoutubeDLSoundCloudAudioProtocol
}
export interface IYoutubeVideo extends youtube_v3.Schema$Video {
  songUrl?: string
  contentDetails?: youtube_v3.Schema$VideoContentDetails & {
    rawDuration?: number
  }
}
