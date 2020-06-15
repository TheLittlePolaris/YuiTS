import { PassThrough, TransformOptions } from 'stream'
import { parse } from 'url'
import axios from 'axios'
import m3u8stream, { Progress } from 'm3u8stream'
import { PolarisSoundCloudService } from './soundcloud-info.service'

export abstract class PolarisSoundCloudPlayer {
  public static async createMusicStream(
    videoUrl: string,
    options?: TransformOptions | m3u8stream.Options
  ): Promise<PassThrough> {
    if (!videoUrl) throw new Error('Undefined data value')

    const { url, type } = await this.getDownloadLink(videoUrl)

    switch (type) {
      case 'm3u8_native': {
        return Promise.resolve(this.m3u8Stream(url, options))
      }
      case 'http': {
        return await this.axiosHttpStream(url, options)
      }
      default:
        break
    }
  }

  static async axiosHttpStream(url: string, options?: TransformOptions) {
    const stream = new PassThrough()

    // fix for pause/resume downloads
    const headers = { Host: parse(url).hostname }

    const promisedRequest = await axios({
      method: 'GET',
      url,
      headers,
      timeout: 30000,
      responseType: 'stream',
    })

    stream.emit('info', {
      contentLength: promisedRequest.headers['content-length'],
      contentType: promisedRequest.headers['content-type'],
    })

    if (promisedRequest.status === 416) {
      // the file that is being resumed is complete.
      stream.emit('end', promisedRequest.statusText)
      stream.end()
      return
    }

    if (promisedRequest.status !== 200 && promisedRequest.status !== 206) {
      stream.emit(
        'error',
        `Status code: ${promisedRequest.status}. Status message: ${promisedRequest.statusText}`
      )
      return
    }

    const requestData = promisedRequest.data
    requestData.pipe(stream)

    return stream
  }

  static m3u8Stream(url: string, options?: m3u8stream.Options) {
    const stream: PassThrough = new PassThrough()

    const { highWaterMark } = options
    const m3u8Stream = m3u8stream(url, {
      parser: 'm3u8',
      chunkReadahead: 5,
      highWaterMark,
      requestOptions: {
        maxRetries: 1,
        highWaterMark,
      },
    })

    m3u8Stream.on('progress', (data: Progress) => {
      stream.emit('progress', data)
    })

    m3u8Stream.on('error', (error) => stream.emit('error', error))

    m3u8Stream.on('end', () => {
      stream.emit('end')
      stream.end()
    })

    m3u8Stream.pipe(stream)

    return stream
  }

  public static async getDownloadLink(videoUrl: string) {
    const soundcloudDll = (await PolarisSoundCloudService.getInfoUrl(videoUrl, {
      getUrl: true,
    })) as {
      url: string
      type: string
    }
    return soundcloudDll
  }
}
