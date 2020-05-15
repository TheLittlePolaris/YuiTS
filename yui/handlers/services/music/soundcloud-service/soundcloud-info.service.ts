// import youtubedl from 'youtube-dl'
import { ISoundCloudSong } from '../music-interfaces/soundcloud-info.interface'
import { IYoutubeVideo } from '../music-interfaces/youtube-info.interface'
import { spawnSync, SpawnSyncOptions } from 'child_process'

enum FORMAT_URL {
  MU3U8_64 = 0,
  MU3U8_128 = 1,
  HTTP_128 = 2,
}

enum FORMAT_THUMBNAILS {
  mini = 0,
  tiny = 1,
  small = 2,
  badge = 3,
  t67x67 = 4,
  large = 5,
  t300x300 = 6,
  crop = 7,
  t500x500 = 8,
  original = 9,
}
export abstract class SoundCloudService {
  // TODO: UPDATE NEXT VERSION OF YOUTUBE-DL, fail for user playlist
  public static async getInfoUrl(url: string, options?: SpawnSyncOptions) {
    if (!url || !url.length) throw new Error('Empty url')
    const result = await spawnSync(
      'youtube-dl',
      ['--dump-json', '-f', 'best', '--', url],
      {
        ...options,
        encoding: 'utf-8',
      }
    )
    const rawInfo = result.stdout.trim().split(/\r?\n/)
    if (!rawInfo || !rawInfo.length) return []
    const info = rawInfo
      .map((item) => this.mapToYoutubeVideoFormat(JSON.parse(item)))
      .filter(Boolean)
    if (!info) throw new Error('Cannot get any info')
    // console.log(info)

    return info.length > 1 ? info : info[0]
  }

  // public static async getInfoYtdl(url: string) {
  //   youtubedl.getInfo(url, (err, info) => {
  //     console.log(info)
  //   })
  // }

  static mapToYoutubeVideoFormat = (info: ISoundCloudSong): IYoutubeVideo => {
    const {
      id,
      webpage_url,
      formats,
      title,
      uploader_id,
      uploader,
      thumbnails,
      thumbnail,
      duration,
      protocol,
      url,
    } = info

    const selectedFormat =
      formats[FORMAT_URL.MU3U8_128] || formats[FORMAT_URL.HTTP_128]

    return {
      id: id,
      soundcloudInfo: {
        url: selectedFormat.url || url,
        type: selectedFormat.protocol || protocol,
      },
      songUrl: webpage_url,
      snippet: {
        title: title,
        channelId: uploader_id,
        channelTitle: uploader,
        thumbnails: {
          default: {
            url: thumbnails[FORMAT_THUMBNAILS.t500x500]?.url || thumbnail,
          },
        },
      },
      contentDetails: {
        rawDuration: Math.round(duration), // mapped
      },
    }
  }
}
