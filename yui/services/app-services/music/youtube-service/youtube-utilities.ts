import { YuiLogger } from '@/services/logger/logger.service'

export function isYoutubeUrl(link: string): boolean {
  return /^(https?:\/\/)?(www\.)?(music\.)?(youtube\.com|youtu\.be)\//i.test(link)
}

export function isYoutubePlaylistUrl(link: string): boolean {
  return /[?&]{1}list=/i.test(link)
}

export function youtubeTimeConverter(duration: string): Promise<number> {
  return new Promise((resolve, _) => {
    try {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
      if (!match) return resolve(0)
      match.shift()
      const result =
        (parseInt(match[0], 10) || 0) * 3600 + // hours
        (parseInt(match[1], 10) || 0) * 60 + // minutes
        (parseInt(match[2], 10) || 0) // seconds
      resolve(result)
    } catch (err) {
      YuiLogger.error(new Error(err))
      resolve(0)
    }
  })
}
