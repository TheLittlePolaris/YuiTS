import { PassThrough, TransformOptions, Readable } from 'stream';
import { URL } from 'url';

import axios, { AxiosResponse } from 'axios';
import { default as M3U8Stream, Progress, Options as M3U8Options } from 'm3u8stream';
import { Injectable } from 'djs-ioc-container';

import { PolarisSoundCloudService } from './soundcloud-info.service';

import { YuiLogger } from '@/logger/logger.service';

@Injectable()
export class PolarisSoundCloudPlayer {
  constructor(private readonly soundcloudService: PolarisSoundCloudService) {}

  public async createMusicStream(
    videoUrl: string,
    options?: TransformOptions | M3U8Options
  ): Promise<PassThrough> {
    if (!videoUrl) throw new Error('Undefined url');

    const { url, type } = await this.getDownloadLink(videoUrl);
    return type === 'm3u8_native'
      ? Promise.resolve(this.generateM3U8Stream(url, options))
      : this.generateAxiosHttpStream(url);
  }

  private async generateAxiosHttpStream(url: string): Promise<PassThrough> {
    const stream = new PassThrough();
    const whatwgUrl = new URL(url);
    // fix for pause/resume downloads
    const headers = { Host: whatwgUrl.hostname, Origin: whatwgUrl.origin };

    const promisedRequest: AxiosResponse<Readable> = await axios
      .get<Readable>(url, {
        headers,
        timeout: 30000,
        onDownloadProgress: (progressEvent) => stream.emit('progress', progressEvent),
        responseType: 'stream'
      })
      .catch((rejectedReason) => {
        YuiLogger.error(rejectedReason);
        return null;
      });

    if (promisedRequest?.status === 416) {
      // the file that is being resumed is complete.
      stream.emit('end', promisedRequest?.statusText);
      stream.end();
    }

    if (promisedRequest?.status !== 200 && promisedRequest?.status !== 206)
      stream.emit(
        'error',
        new Error(
          `Status code: ${promisedRequest?.status}. Status message: ${promisedRequest?.statusText}`
        )
      );

    if (!promisedRequest?.data) {
      stream.emit('error', new Error('Something went wrong'));
      stream.end();
      return null;
    }

    promisedRequest.data.pipe(stream);

    return stream;
  }

  private generateM3U8Stream(url: string, options?: M3U8Options): PassThrough {
    const stream: PassThrough = new PassThrough();

    const { highWaterMark } = options;
    const m3u8Stream = M3U8Stream(url, {
      parser: 'm3u8',
      chunkReadahead: 10,
      highWaterMark,
      requestOptions: {
        maxRetries: 1,
        highWaterMark
      }
    });

    m3u8Stream.on('progress', (data: Progress) => stream.emit('progress', data));
    m3u8Stream.on('error', (error: Error) => stream.emit('error', error));

    m3u8Stream.on('end', () => {
      stream.emit('end');
      stream.end();
    });

    m3u8Stream.pipe(stream);

    return stream;
  }

  public async getDownloadLink(videoUrl: string): Promise<{
    url: string;
    type: string;
  }> {
    const soundcloudDll = (await this.soundcloudService.getSoundcloudInfoFromUrl(videoUrl, {
      getUrl: true
    })) as {
      url: string;
      type: string;
    };
    return soundcloudDll;
  }
}
