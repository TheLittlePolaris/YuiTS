import { ISoundCloudSong } from '../music-interfaces/soundcloud-info.interface'
import { IYoutubeVideo } from '../music-interfaces/youtube-info.interface'
import {
  spawnSync,
  SpawnSyncOptions,
  spawn,
  execFile,
  ChildProcessByStdio,
} from 'child_process'
import { resolve } from 'dns'
import { Readable, Writable } from 'stream'

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
export abstract class PolarisSoundCloudService {
  public static async getInfoUrl(
    url: string,
    {
      getUrl,
      options,
    }: {
      getUrl?: boolean
      options?: SpawnSyncOptions
    } = { getUrl: false, options: {} }
  ) {
    if (!url || !url.length) throw new Error('Empty url')
    return new Promise((resolve, reject) => {
      try {
        const process = spawn(
          'youtube-dl',
          ['--skip-download', '-s', '--dump-json', '--', url],
          { stdio: ['inherit', 'pipe', 'pipe'] }
        )
        console.log(`SPAWN ${process.pid}`)

        let results: (IYoutubeVideo | { url: string; type: string })[] = []

        process.stdout.on('data', (buffer: Buffer) => {
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

        process.stdout.on('end', () => {
          resolve(results.length > 1 ? results : results[0])
        })
        process.stdout.on('close', () => {
          // console.log('STDOUT CLOSEEEEE')
        })
        process.stdout.on('error', (error) => {
          cleanProcess(error)
        })

        const cleanProcess = (error: Error) => {
          process.stdout.emit('end')
          setTimeout(() => {
            process.stdout.destroy(error)
            process.kill()
          }, 100)
        }
        process.stderr.on('data', (buffer: Buffer) => {
          const rawInfo = buffer.toString('utf-8')
          cleanProcess(new Error(rawInfo))
        })
        process.stderr.on('error', (error) => {
          // console.error(error, ' <==== STD ERR ERROR')
          cleanProcess(error)
        })
        // DEBUG CODE
        process.stderr.on('end', () => {
          console.log('STD ERROR EEEEEEEEEEEEEENDDD')
        })
        process.stderr.on('close', () => {
          console.log('STD ERROR CLOSEEEEEEEEEEEEEEEEEEE')
        })

        process.on('exit', (code: number, signal: NodeJS.Signals) => {
          console.log(code, ' <==== PROCESS EIT WITH CODE')
        })

        process.on('close', () => {
          console.log('PROCESS CLOSE')
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  // const rawInfo = result.stdout.trim().split(/\r?\n/)
  // if (!rawInfo || !rawInfo.length) return []

  // const info = rawInfo
  //   .map((item) => this.mapToYoutubeVideoFormat(JSON.parse(item), getUrl))
  //   .filter(Boolean)
  // if (!info) throw new Error('Cannot get any info')

  // return info.length > 1 ? info : info[0]

  public static async getInfoUrlTest(url: string, options?: SpawnSyncOptions) {
    if (!url || !url.length) throw new Error('Empty url')
    const time = console.time('json')
    const result = await spawnSync(
      'youtube-dl',
      ['--skip-download', '-s', '--dump-json', '--', url],
      {
        ...options,
        encoding: 'utf-8',
      }
    )
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

  static mapToYoutubeVideoFormat = (
    info: ISoundCloudSong,
    getUrl: boolean = false
  ): IYoutubeVideo | { url: string; type: string } => {
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
      formats[FORMAT_URL.M3U8_128] || formats[FORMAT_URL.HTTP_128]

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
}
