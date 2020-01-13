import request from 'request';
import { errorLogger } from '@/handlers/error.handler';
import { ConfigService } from '@/env-config/config.service';

export function youtubeRequestService<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request(
      `${url}&key=${ConfigService.youtubeApiKey}`,
      (err: string, _, body: string) => {
        if (err) {
          handleRequestErrors(err);
          reject('Something went wrong');
        }
        const json = JSON.parse(body);
        const { error, items } = json;
        if (error || !items) {
          handleRequestErrors(error);
          resolve(null);
        }
        resolve(json);
      }
    );
  });
}

function handleRequestErrors(error: string): void {
  return errorLogger(error, 'REQUEST_SERVICE');
}
