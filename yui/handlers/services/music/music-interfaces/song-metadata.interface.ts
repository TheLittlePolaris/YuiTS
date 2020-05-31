import type { IYoutubeDLSoundCloudAudioProtocol } from './soundcloud-info.interface'
import { ISoundCloudInfo } from './youtube-info.interface'

export interface ISong {
  id: string
  title: string
  channelId: string
  channelTitle: string
  duration: number // duration in seconds
  requester: string
  videoUrl: string
  videoThumbnail: string
  type: 'youtube' | 'soundcloud'
}
