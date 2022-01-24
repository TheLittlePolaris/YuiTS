import {
  ISoundCloudSong,
  SoundcloudGetUrlInfoType,
  SoundcloudInfoRecord,
} from '../music-interfaces/soundcloud-info.interface'
import { spawn } from 'child_process'
import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { YuiLogger } from '@/services/logger/logger.service'

enum FORMAT_URL {
  M3U8_64,
  M3U8_128,
  HTTP_128,
}

enum FORMAT_THUMBNAILS {
  mini,
  tiny,
  small,
  badge,
  t67x67,
  large,
  t300x300,
  crop,
  t500x500,
  original,
}

@Injectable()
export class PolarisSoundCloudService {
  private collectBufferData(buffer: Buffer, previousBuffer: string) {
    let data = buffer.toString('utf-8')
    if (!data.length) return { done: false, data: '', more: false }

    if (data.startsWith('{') && !data.endsWith('}\n')) {
      return { done: false, data, more: true }
    } else if (!data.startsWith('{') && !data.endsWith('}\n')) {
      return { done: false, data: previousBuffer + data, more: true }
    } else if (!data.startsWith('{') && data.endsWith('}\n')) {
      data = previousBuffer + data
    }

    try {
      return { done: true, data: JSON.parse(data), more: false }
    } catch (e) {
      return { done: false, data: '', more: false }
    }
  }

  public async getSoundcloudInfoFromUrl(
    url: string,
    { getUrl } = { getUrl: false }
  ): Promise<SoundcloudGetUrlInfoType> {
    if (!url || !url.length) return Promise.reject('Empty url')
    return new Promise((resolve, reject) => {
      try {
        const processExecution = spawn(
          'youtube-dl',
          ['--skip-download', '--no-cache-dir', '-s', '--dump-json', '--', url],
          {
            stdio: ['inherit', 'pipe', 'pipe'],
          }
        )
        YuiLogger.info(
          `youtube-dl process [${processExecution.pid}] spawned`,
          PolarisSoundCloudService.name
        )

        const results: SoundcloudInfoRecord[] = []
        // eslint-disable-next-line prefer-const
        let previousBuffer = ''

        processExecution.stdout
          .on('data', (buffer: Buffer) => {
            const { more, data, done } = this.collectBufferData(buffer, previousBuffer)
            if (!done) return (previousBuffer = more ? previousBuffer + (data || '') : '')
            else previousBuffer = ''
            results.push(this.mapToYoutubeVideoFormat(data, getUrl))
          })
          .on('end', () => {
            resolve(results.length > 1 ? results : results[0])
          })

        processExecution.on('close', () =>
          YuiLogger.info(`youtube-dl process [${processExecution.pid}] closed`)
        )

        const onError = (error: Error) => {
          YuiLogger.error(
            `youtube-dl process [${processExecution.pid}] got error: ${error.message}`,
            PolarisSoundCloudService.name
          )
          if (!processExecution.killed) processExecution.kill('SIGKILL')
          reject(error)
        }
        processExecution.stderr.on('data', onError)
        processExecution.on('error', onError)
      } catch (err) {
        reject(err)
      }
    })
  }

  mapToYoutubeVideoFormat = (info: ISoundCloudSong, getUrl = false): SoundcloudInfoRecord => {
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

    const selectedFormat = formats[FORMAT_URL.M3U8_128] || formats[FORMAT_URL.HTTP_128] // select m3u8 as default

    if (getUrl) {
      return {
        url: selectedFormat.url || url,
        type: selectedFormat.protocol || protocol,
      }
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

  // public async getInfoUrlTest(url: string, options?: SpawnSyncOptions): Promise<unknown[]> {
  //   if (!url || !url.length) throw new Error('Empty url')
  //   const result = await spawnSync(
  //     'youtube-dl',
  //     ['--skip-download', '-s', '--dump-json', '--', url],
  //     {
  //       ...options,
  //       encoding: 'utf-8',
  //     }
  //   )
  //   const timeEnd = console.timeEnd('json')
  //   const rawInfo = result.stdout.trim().split(/\r?\n/)
  //   console.log(rawInfo[0])
  //   if (!rawInfo || !rawInfo.length) return []

  //   const info = rawInfo
  //     .map((item) => {
  //       try {
  //         return JSON.parse(item)
  //       } catch (err) {
  //         return item
  //       }
  //     })
  //     .filter(Boolean)
  //   if (!info) throw new Error('Cannot get any info')
  //   return info
  // }
}
