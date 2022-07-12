import { IYoutubeVideo } from './youtube-info.interface'

export type YoutubeDLSoundcloudFormatId = 'hls_opus_64' | 'hls_mp3_128' | 'http_mp3_128'

export type IYoutubeDLFormat =
  | 'http_mp3_128 - audio only'
  | 'hls_mp3_128 - audio only'
  | 'hls_opus_64 - audio only'

export type IYoutubedlSoundcloudThumbnailId =
  | 'mini'
  | 'tiny'
  | 'small'
  | 'badge'
  | 't67x67'
  | 'large'
  | 't300x300'
  | 'crop'
  | 't500x500'
  | 'original'

export type IYoutubeDLFormatExtractor = 'soundcloud'
export type IYoutubeDLFormatExtractorKey = 'Soundcloud'
export type IYoutubeDLSoundCloudAudioProtocol = 'm3u8_native' | 'http'

export interface ISoundCloudSongFormat {
  ext: string
  protocol: IYoutubeDLSoundCloudAudioProtocol
  preference: unknown
  vcodec: string // none
  format: string
  url: string
  format_id: YoutubeDLSoundcloudFormatId // known formats
  http_headers: Record<string, unknown>
  abr: number
}

export interface ISoundCloudSongThumbnail {
  url: string
  resolution?: string
  id: IYoutubedlSoundcloudThumbnailId
  preference?: number
  height?: number
  width?: number
}

// base on youtube-dl response
export interface ISoundCloudSong {
  display_id: string
  extractor: IYoutubeDLFormatExtractor
  protocol: IYoutubeDLSoundCloudAudioProtocol
  description: string
  uploader_id: string // number
  upload_date: string // number
  requested_subtitles: unknown
  formats: ISoundCloudSongFormat[]
  genre: string
  _filename: string
  like_count: number
  preference: unknown
  uploader: string // uploader name
  duration: number //3:19.46199999999999
  format_id: YoutubeDLSoundcloudFormatId
  http_headers: Record<string, unknown>
  playlist_index: unknown
  view_count: number
  playlist: string | null
  ext: string
  thumbnails: ISoundCloudSongThumbnail[]
  license: string
  title: string
  url: string
  extractor_key: IYoutubeDLFormatExtractorKey
  vcodec: 'none'
  format: YoutubeDLSoundcloudFormatId
  repost_count: number
  id: string
  comment_count: number
  uploader_url: string //'https://soundcloud.com/capchii',
  webpage_url: string // 'https://soundcloud.com/capchii/1cfawv7qmjcf',
  timestamp: number
  abr: number
  fulltitle: string
  thumbnail: string // 'https://i1.sndcdn.com/artworks-000327927942-hpumgb-original.jpg',
  webpage_url_basename: string
}

export type SoundcloudInfoRecord = IYoutubeVideo | { url: string; type: string }
export type SoundcloudGetUrlInfoType = SoundcloudInfoRecord | SoundcloudInfoRecord[]
