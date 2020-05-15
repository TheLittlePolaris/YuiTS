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
    const stream = new PassThrough({ highWaterMark: options.highWaterMark })
    switch (type) {
      case 'm3u8_native': {
        return Promise.resolve(this.m3u8Stream(url, stream, options))
      }
      case 'http': {
        return await this.axiosHttpStream(url, stream, options)
      }
    }
  }

  static async axiosHttpStream(
    url: string,
    stream: PassThrough,
    options?: TransformOptions
  ) {
    // fix for pause/resume downloads
    const headers = { Host: parse(url).hostname }

    const promisedRequest = await axios({
      method: 'GET',
      url,
      headers,
      timeout: 30000,
      responseType: 'stream',
    })
    const requestData = promisedRequest.data

    requestData.on('response', (response: any) => {
      stream.emit('info', {
        contentLength: response.headers['content-length'],
        contentType: response.headers['content-type'],
      })

      if (response.statusCode === 416) {
        // the file that is being resumed is complete.
        return stream.emit('complete', response.statusMessage)
      }

      if (response.statusCode !== 200 && response.statusCode !== 206) {
        return stream.emit(
          'error',
          new Error(
            `Status code: ${response.statusCode}. Status message: ${response.statusMessage}`
          )
        )
      }
    })

    requestData.pipe(stream)

    return stream
  }

  static m3u8Stream(
    url: string,
    stream: PassThrough,
    options?: m3u8stream.Options
  ) {
    const { highWaterMark } = options
    const m3u8Request = m3u8stream(url, {
      parser: 'm3u8',
      chunkReadahead: 4,
      highWaterMark,
      requestOptions: {
        maxRetries: 3,
      },
    })
    m3u8Request.on('progress', (data) => stream.emit('progress', data))
    m3u8Request.pipe(stream)

    return stream
  }
}
