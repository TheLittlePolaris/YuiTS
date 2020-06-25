import { MusicQueue } from '../music-entities/music-queue'
import { errorLogger } from '@/handlers/log.handler'

export enum STREAM_STATUS {
  LIVE = 'LIVE',
  QUEUE_LOOPING = 'Queue Looping',
  LOOPING = 'Looping',
}

export function timeConverter(duration: number): Promise<string | number> {
  return new Promise((resolve, _) => {
    if (duration === 0) {
      return resolve(STREAM_STATUS.LIVE)
    }
    const totalMinutes = Math.floor(duration / 60)
    const seconds =
      duration % 60 >= 10 ? `${duration % 60}` : `0${duration % 60}`
    if (totalMinutes < 60) {
      return resolve(
        `${totalMinutes >= 10 ? totalMinutes : `0${totalMinutes}`}:${seconds}`
      )
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutesLeft = totalMinutes % 60
      return resolve(
        `${hours >= 10 ? hours : `0${hours}`}:${
          minutesLeft >= 10 ? minutesLeft : `0${minutesLeft}`
        }:${seconds}`
      )
    }
  })
}

export function createProgressBar(
  currentProgress: number,
  total: number
): string {
  if (isNaN(total)) return '--------------------------------------⦿'
  const temp = '----------------------------------------'
  const index = Math.round((currentProgress / total) * 40)
  return `${temp.substr(0, index)}⦿${temp.substr(index + 1)}`
}

export function printQueueList(
  queue: MusicQueue,
  start: number,
  end: number
): Promise<string> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<string>(async (resolve, _) => {
    let result = ''
    for (let i = start; i <= end; i++) {
      const song = queue.at(i)
      result += `#${i}: **${song.title}** - \`(${await timeConverter(
        song.duration
      )})\`\n*Requested by \`${song.requester}\`*\n\n`
    }
    resolve(result)
  })
}
