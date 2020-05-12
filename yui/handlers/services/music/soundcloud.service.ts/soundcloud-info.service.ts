import youtubedl from 'youtube-dl'
import { ISoundCloudSong } from '../music-interfaces/soundcloud-info.interface'
import { IYoutubeVideo } from '../music-interfaces/youtube-info.interface'

export abstract class SoundCloudService {
  public static getSongInformation(url: string) {
    return new Promise<IYoutubeVideo>((resolve, reject) => {
      youtubedl.getInfo(url, (error: any, info: ISoundCloudSong) => {
        if (error) reject(error)
        if (!info && !info.id) reject('Something went wrong.')
        resolve(this.mapToYoutubeVideoFormat(info))
      })
    })
  }

  static mapToYoutubeVideoFormat = (info: ISoundCloudSong): IYoutubeVideo => ({
    id: info.id,
    songUrl: info.webpage_url, // mapped
    snippet: {
      title: info.title,
      channelId: info.uploader_id,
      channelTitle: info.uploader,
      thumbnails: {
        default: {
          url:
            info.thumbnails.find((t) => t.id === 'crop')?.url || info.thumbnail,
        },
      },
    },
    contentDetails: {
      rawDuration: Math.round(info._duration_raw), // mapped
    },
  })

  public static getPlaylistInformation(playlistUrl: string) {
    return new Promise<IYoutubeVideo[]>((resolve, reject) => {
      youtubedl.getInfo(playlistUrl, (error: any, infos: ISoundCloudSong[]) => {
        if (error) reject(error)
        if (!infos && !infos.length) reject('Something went wrong.')
        const results = infos
          .filter(Boolean)
          .map((info) => this.mapToYoutubeVideoFormat(info))
        resolve(results)
      })
    })
  }
}
