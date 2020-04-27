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
        global?.config?.tenorAnonymousId
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

export const subscriberCountFormatter = (number: number | string) => {
  number = typeof number === 'string' ? Number(number) : number
  let result: string

  if (number > 0 && number <= 999) result = `${number}`
  else if (number > 999 && number <= 999999)
    result = `${(number / 1000).toFixed(2)}K`
  else if (number > 999999 && number <= 999999999)
    result = `${(number / 1000000).toFixed(2)}M`
  else result = `${number}`

  return result.includes('.00') ? result.replace('.00', '') : result
}

export const dateTimeJSTFormatter = (iso8601DateString: string) =>
  `${new Date(iso8601DateString).toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })} JST`
