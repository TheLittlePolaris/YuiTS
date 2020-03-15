import request from 'request';
import { errorLogger } from '@/handlers/error.handler';

export function youtubeRequestService<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request(
      `${url}&key=${global?.config?.youtubeApiKey}`,
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
  return errorLogger(error, 'YOUTUBE_REQUEST_SERVICE');
}
