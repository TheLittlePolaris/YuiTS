import { debugLogger } from '@/handlers/log.handler'
import { google, youtube_v3 } from 'googleapis'

export abstract class HoloStatService {
  static youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: global.config.youtubeApiKey,
  })

  static YoutubeChannel = HoloStatService.youtube.channels

  constructor() {
    debugLogger('HoloStatService')
  }
  public static hololiveOfficialChannelId = 'UCJFZiqLMntJufDCHc6bQixg' // official, default, hololive japan
  public static ayundaRisuChannelId = 'UCOyYb1c43VlX9rc_lT6NKQw' // hololive indonesia

  public static async getChannelFeatures(
    region?: 'id' | 'jp'
  ): Promise<youtube_v3.Schema$Channel[]> {
    const selectedRegionId =
      region && region === 'id'
        ? this.ayundaRisuChannelId
        : this.hololiveOfficialChannelId

    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'brandingSettings',
      id: selectedRegionId,
      fields: 'items(brandingSettings(channel(featuredChannelsUrls)))',
    }

    const featuredData = await this.YoutubeChannel.list(getChannelsOptions)

    if (!featuredData?.data?.items[0])
      throw new Error('Sonething went wrong! Cannot get featuredChannels')

    const featuredChannelsUrls =
      featuredData?.data?.items[0]?.brandingSettings?.channel
        ?.featuredChannelsUrls

    if (!featuredChannelsUrls?.length)
      throw new Error('Cannot find any related channels from Hololive Official')

    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'statistics,brandingSettings,snippet',
      id: [...featuredChannelsUrls, selectedRegionId].join(','),
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const holoStat = await this.YoutubeChannel.list(getDataOptions)

    if (!holoStat?.data?.items?.length) throw new Error('Cannot get any data')

    return holoStat.data.items
  }
}
