import { youtube_v3 } from 'googleapis'

// re-map interface name

export interface IYoutubeSearchResult
  extends youtube_v3.Schema$SearchListResponse {}

export interface IYoutubeVideosResult
  extends youtube_v3.Schema$VideoListResponse {}

export interface IYoutubePlaylistResult
  extends youtube_v3.Schema$PlaylistItemListResponse {}

export interface IYoutubeVideo extends youtube_v3.Schema$Video {
  songUrl?: string
  contentDetails?: youtube_v3.Schema$VideoContentDetails & {
    rawDuration?: number
  }
}
