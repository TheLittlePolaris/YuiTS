import { MusicQueue } from '../music-entities/music-queue'
import { errorLogger } from '@/handlers/log.handler'

export function isYoutubeUrl(link: string): boolean {
  return /^(https?:\/\/)?(www\.)?(music\.)?(youtube\.com|youtu\.be)\//i.test(
    link
  )
}

export function isYoutubePlaylistUrl(link: string): boolean {
  return /[\?\&]{1}list=/i.test(link)
}

export function youtubeTimeConverter(duration: string): Promise<number> {
  return new Promise((resolve, _) => {
    try {
      var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/).slice(1)
      var result =
        (parseInt(match[0], 10) || 0) * 3600 + // hours
        (parseInt(match[1], 10) || 0) * 60 + // minutes
        (parseInt(match[2], 10) || 0) // seconds
      resolve(result)
    } catch (err) {
      errorLogger(new Error(err))
      resolve(0)
    }
  })
}

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
    let totalMinutes = Math.floor(duration / 60)
    let seconds = duration % 60 >= 10 ? `${duration % 60}` : `0${duration % 60}`
    if (totalMinutes < 60) {
      return resolve(
        `${totalMinutes >= 10 ? totalMinutes : `0${totalMinutes}`}:${seconds}`
      )
    } else {
      let hours = Math.floor(totalMinutes / 60)
      let minutesLeft = totalMinutes % 60
      return resolve(
        `${hours >= 10 ? hours : `0${hours}`}:${
          minutesLeft >= 10 ? minutesLeft : `0${minutesLeft}`
        }:${seconds}`
      )
    }
  })
}

export function createProgressBar(currentProgress: number, total: number) {
  return new Promise((resolve, _) => {
    if (isNaN(total)) {
      resolve('--------------------------------------⦿')
    } else {
      let temp = '----------------------------------------'
      const index = Math.round((currentProgress / total) * 40)
      resolve(`${temp.substr(0, index)}⦿${temp.substr(index + 1)}`)
    }
  })
}

export function printQueueList(
  queue: MusicQueue,
  start: number,
  end: number
): Promise<string> {
  return new Promise<string>(async (resolve, _) => {
    var result = ''
    for (let i = start; i <= end; i++) {
      const song = queue.at(i)
      result += `#${i}: **${song.title}** - \`(${await timeConverter(
        song.duration
      )})\`\n*Requested by \`${song.requester}\`*\n\n`
    }
    resolve(result)
  })
}
