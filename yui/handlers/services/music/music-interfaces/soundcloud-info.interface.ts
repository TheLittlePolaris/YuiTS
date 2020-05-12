export type YoutubedlSoundcloudFormatId =
  | 'hls_opus_64'
  | 'hls_mp3_128'
  | 'http_mp3_128'

export type IYoutubedlFormat =
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

export type IYoutubedlFormatExtractor = 'soundcloud'
export type IYoutubedlFormatExtractorKey = 'Soundcloud'
export type IYoutubedlSoundCloudProtocol = 'm3u8_native' | 'http'

export interface ISoundCloudSongFormat {
  ext: string
  protocol: IYoutubedlSoundCloudProtocol
  preference: any
  vcodec: string // none
  format: string
  url: string
  format_id: YoutubedlSoundcloudFormatId // known formats
  http_headers: Object
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
  extractor: IYoutubedlFormatExtractor
  protocol: IYoutubedlSoundCloudProtocol
  description: string
  uploader_id: string // number
  upload_date: string // number
  requested_subtitles: any
  formats: ISoundCloudSongFormat[]
  genre: string
  _filename: string
  like_count: number
  preference: any
  uploader: string // uploader name
  duration: string //3:19.46199999999999
  format_id: YoutubedlSoundcloudFormatId
  http_headers: Object
  playlist_index: any
  view_count: number
  playlist: string | null
  ext: string
  thumbnails: ISoundCloudSongThumbnail[]
  license: string
  title: string
  url: string
  extractor_key: IYoutubedlFormatExtractorKey
  vcodec: 'none'
  format: YoutubedlSoundcloudFormatId
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
  _duration_raw: number // 199.462,
  _duration_hms: string // '00:03:19.462'
}
