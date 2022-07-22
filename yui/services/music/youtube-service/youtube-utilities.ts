import { YuiLogger } from '@/logger/logger.service'

export function isYoutubeUrl(link: string): boolean {
  return /^(https?:\/\/)?(www\.)?(music\.)?(youtube\.com|youtu\.be)\//i.test(link)
}

export function isYoutubePlaylistUrl(link: string): boolean {
  return /[?&]{1}list=/i.test(link)
}

export function youtubeTimeConverter(duration: string): number {
  try {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0
    match.shift()
    const result =
      (parseInt(match[0], 10) || 0) * 3600 + // hours
      (parseInt(match[1], 10) || 0) * 60 + // minutes
      (parseInt(match[2], 10) || 0) // seconds
    return result
  } catch (err) {
    YuiLogger.error(err)
    return 0
  }
}