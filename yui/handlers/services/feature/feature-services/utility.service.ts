import request from 'request'
import { errorLogger } from '@/handlers/log.handler'
import { TenorApiQueryResult } from '../feature-interfaces/tenor-query.interface'

export function isMyOwner(userId: string) {
  return userId === global?.config?.ownerId
}

export function tenorRequestService(
  query: string
): Promise<TenorApiQueryResult> {
  return new Promise<TenorApiQueryResult>((resolve, reject) => {
    request(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${query}`
      )}&key=${global?.config?.tenorKey}&limit=10&media_filter=basic&anon_id=${
        global?.config?.tenorKey
      }`,
      (err: string, _, body: string) => {
        if (err) return reject(err)
        const json = JSON.parse(body)
        const { error } = json
        if (error) reject(handleRequestErrors(error))
        resolve(json)
      }
    )
  })
}

function handleRequestErrors(error: string): null {
  return errorLogger(error, 'UTILITY_SERVICE')
}
