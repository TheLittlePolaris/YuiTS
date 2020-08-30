import { ISoundCloudSong } from '../music-interfaces/soundcloud-info.interface'
import { IYoutubeVideo } from '../music-interfaces/youtube-info.interface'
import { spawnSync, SpawnSyncOptions, spawn } from 'child_process'
import { errorLogger } from '@/handlers/log.handler'
import { LOG_SCOPE } from '@/constants/constants'
import { Injectable } from '@/decorators/dep-injection-ioc/decorators'

enum FORMAT_URL {
  M3U8_64 = 0,
  M3U8_128 = 1,
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

@Injectable()
export class PolarisSoundCloudService {
  public async getInfoUrl(
    url: string,
    {
      getUrl,
    }: {
      getUrl?: boolean
    } = { getUrl: false }
  ): Promise<IYoutubeVideo | { url: string; type: string } | (IYoutubeVideo | { url: string; type: string })[]> {
    if (!url || !url.length) throw new Error('Empty url')
    return new Promise((resolve, reject) => {
      try {
        const process = spawn('youtube-dl', ['--skip-download', '--no-cache-dir', '-s', '--dump-json', '--', url], {
          stdio: ['inherit', 'pipe', 'pipe'],
        })
        console.log(`SPAWN ${process.pid}`)
        const results: (IYoutubeVideo | { url: string; type: string })[] = []
        process.stdout
          .on('data', (buffer: Buffer) => {
            const parseRawInfo = (data: string) => {
              try {
                return JSON.parse(data)
              } catch (e) {
                return null
              }
            }
            const parsedRaw = parseRawInfo(buffer.toString('utf-8'))
            if (!parsedRaw) return
            const parsed = this.mapToYoutubeVideoFormat(parsedRaw, getUrl)
            results.push(parsed)
          })
          .on('end', () => {
            resolve(results.length > 1 ? results : results[0])
          })
          .on('error', (error) => {
            cleanProcessOnErr(error)
          })

        const cleanProcessOnErr = (error: Error) => {
          process.stdout.emit('end')
          setTimeout(() => {
            process.stdout.destroy(error)
            process.kill()
          }, 100)
        }
        process.stderr
          .on('data', (buffer: Buffer) => {
            const rawInfo = buffer.toString('utf-8')
            cleanProcessOnErr(new Error(rawInfo))
          })
          .on('error', (error) => {
            cleanProcessOnErr(error)
          })
      } catch (err) {
        reject('Fatal Error: ' + err)
      }
    })
  }

  public async getInfoUrlTest(url: string, options?: SpawnSyncOptions): Promise<unknown[]> {
    if (!url || !url.length) throw new Error('Empty url')
    const time = console.time('json')
    const result = await spawnSync('youtube-dl', ['--skip-download', '-s', '--dump-json', '--', url], {
      ...options,
      encoding: 'utf-8',
    })
    const timeEnd = console.timeEnd('json')
    const rawInfo = result.stdout.trim().split(/\r?\n/)
    console.log(rawInfo[0])
    if (!rawInfo || !rawInfo.length) return []

    const info = rawInfo
      .map((item) => {
        try {
          return JSON.parse(item)
        } catch (err) {
          return item
        }
      })
      .filter(Boolean)
    if (!info) throw new Error('Cannot get any info')
    return info
  }

  mapToYoutubeVideoFormat = (info: ISoundCloudSong, getUrl = false): IYoutubeVideo | { url: string; type: string } => {
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

    const selectedFormat = formats[FORMAT_URL.M3U8_128] || formats[FORMAT_URL.HTTP_128]

    if (getUrl)
      return {
        url: selectedFormat.url || url,
        type: selectedFormat.protocol || protocol,
      }

    return {
      id: id,
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
        rawDuration: Math.round(duration),
      },
    }
  }

  handleError(error: string | Error): null {
    return errorLogger(error, LOG_SCOPE.SOUNDCLOUD_INFO_SERICE)
  }
}
