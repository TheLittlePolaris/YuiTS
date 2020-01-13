import request from 'request';
import { errorLogger } from '@/handlers/error.handler';
import { TenorApiQueryResult } from '../feature-interfaces/tenor-query.interface';
import { ConfigService } from '@/config-services/config.service';

export function isMyOwner(userId: string) {
  return userId === ConfigService.ownerId;
}

export function tenorRequestService(
  query: string
): Promise<TenorApiQueryResult> {
  return new Promise<TenorApiQueryResult>((resolve, reject) => {
    request(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${query}`
      )}&key=${ConfigService.tenorKey}&limit=10&media_filter=basic&anon_id=${
        ConfigService.tenorKey
      }`,
      (err: string, _, body: string) => {
        if (err) return reject(err);
        const json = JSON.parse(body);
        const { error } = json;
        if (error) reject(handleRequestErrors(error));
        resolve(json);
      }
    );
  });
}

function handleRequestErrors(error: string): null {
  return errorLogger(error, 'UTILITY_SERVICE');
}
