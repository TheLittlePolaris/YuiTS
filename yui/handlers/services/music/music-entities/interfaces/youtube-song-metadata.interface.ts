import { youtube_v3 } from 'googleapis'

export interface IYoutubeSearchResult
  extends youtube_v3.Schema$SearchListResponse {}

export interface IYoutubeVideosResult
  extends youtube_v3.Schema$VideoListResponse {}

export interface IYoutubePlaylistResult
  extends youtube_v3.Schema$PlaylistItemListResponse {}

export interface IYoutubePlaylistItem extends youtube_v3.Schema$Video {}
