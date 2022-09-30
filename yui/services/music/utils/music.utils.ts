import { MusicQueue } from '../entities/music-queue';

export enum STREAM_STATUS {
  LIVE = 'LIVE',
  QUEUE_LOOPING = 'Queue Looping',
  LOOPING = 'Looping'
}

export function timeConverter(duration: number) {
  if (duration === 0) return STREAM_STATUS.LIVE;

  const totalMinutes = Math.floor(duration / 60);
  const seconds = duration % 60 >= 10 ? `${duration % 60}` : `0${duration % 60}`;
  if (totalMinutes < 60)
    return `${totalMinutes >= 10 ? totalMinutes : `0${totalMinutes}`}:${seconds}`;
  else {
    const hours = Math.floor(totalMinutes / 60);
    const minutesLeft = totalMinutes % 60;
    return `${hours >= 10 ? hours : `0${hours}`}:${
      minutesLeft >= 10 ? minutesLeft : `0${minutesLeft}`
    }:${seconds}`;
  }
}

export function createProgressBar(currentProgress: number, total: number): string {
  if (Number.isNaN(total)) return '---------------------------------------⦿';

  const temporary = '----------------------------------------';
  const index = Math.round((currentProgress / total) * 40);
  return `${temporary.slice(0, Math.max(0, index))}⦿${temporary.slice(Math.max(0, index + 1))}`;
}

export function printQueueList(queue: MusicQueue, start: number, end: number): string {
  let result = '';
  for (let index = start; index <= end; index++) {
    const song = queue.at(index);
    result += `#${index}: **${song.title}** - \`(${timeConverter(
      song.duration
    )})\`\n*Requested by \`${song.requester}\`*\n\n`;
  }
  return result;
}
