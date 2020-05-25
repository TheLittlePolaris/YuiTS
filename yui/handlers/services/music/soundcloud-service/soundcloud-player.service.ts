import { PassThrough, TransformOptions } from 'stream'
import { parse } from 'url'
import axios from 'axios'
import m3u8stream from 'm3u8stream'
import type { IYoutubeDLSoundCloudAudioProtocol } from '../music-interfaces/soundcloud-info.interface'

export abstract class PolarisSoundCloudPlayer {
  public static async createMusicStream(
    data: { url: string; type: IYoutubeDLSoundCloudAudioProtocol },
    options?: TransformOptions | m3u8stream.Options
  ): Promise<PassThrough> {
    if (!data) throw new Error('Undefined data value')
    const { url, type } = data
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
        new Error(
          `Status code: ${promisedRequest.status}. Status message: ${promisedRequest.statusText}`
        )
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
      chunkReadahead: 4,
      highWaterMark,
      requestOptions: {
        maxRetries: 3,
      },
    })

    m3u8Stream.on('progress', (data) => stream.emit('progress', data))

    m3u8Stream.pipe(stream)

    return stream
  }
}
