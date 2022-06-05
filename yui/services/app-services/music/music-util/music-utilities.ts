import { MusicQueue } from '../music-entities/music-queue'

export enum STREAM_STATUS {
  LIVE = 'LIVE',
  QUEUE_LOOPING = 'Queue Looping',
  LOOPING = 'Looping',
}

export function timeConverter(duration: number) {
  if (duration === 0) {
    return STREAM_STATUS.LIVE
  }
  const totalMinutes = Math.floor(duration / 60)
  const seconds = duration % 60 >= 10 ? `${duration % 60}` : `0${duration % 60}`
  if (totalMinutes < 60) {
    return `${totalMinutes >= 10 ? totalMinutes : `0${totalMinutes}`}:${seconds}`
  } else {
    const hours = Math.floor(totalMinutes / 60)
    const minutesLeft = totalMinutes % 60
    return `${hours >= 10 ? hours : `0${hours}`}:${minutesLeft >= 10 ? minutesLeft : `0${minutesLeft}`}:${seconds}`
  }
}

export function createProgressBar(currentProgress: number, total: number): string {
  if (isNaN(total)) return '---------------------------------------⦿'
  const temp = '----------------------------------------'
  const index = Math.round((currentProgress / total) * 40)
  return `${temp.substring(0, index)}⦿${temp.substring(index + 1)}`
}

export function printQueueList(queue: MusicQueue, start: number, end: number): string {
  let result = ''
  for (let i = start; i <= end; i++) {
    const song = queue.at(i)
    result += `#${i}: **${song.title}** - \`(${timeConverter(song.duration)})\`\n*Requested by \`${
      song.requester
    }\`*\n\n`
  }
  return result
}
