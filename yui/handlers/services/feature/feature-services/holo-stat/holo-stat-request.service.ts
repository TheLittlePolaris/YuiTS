import { debugLogger, errorLogger } from '@/handlers/log.handler'
import { google, youtube_v3 } from 'googleapis'
import { LOG_SCOPE } from '@/constants/constants'

export abstract class HoloStatRequestService {
  static youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: global.config.youtubeApiKey,
  })

  static youtubeChannel = HoloStatRequestService.youtube.channels

  constructor() {
    debugLogger('HoloStatService')
  }
  public static hololiveOfficialChannelId = 'UCJFZiqLMntJufDCHc6bQixg' // official, default, hololive japan
  public static ayundaRisuChannelId = 'UCOyYb1c43VlX9rc_lT6NKQw' // hololive indonesia

  public static async getListChannels(
    region: 'id' | 'jp'
  ): Promise<youtube_v3.Schema$Channel[]> {
    const selectedChannelId =
      region && region === 'id'
        ? this.ayundaRisuChannelId
        : this.hololiveOfficialChannelId

    const featuredChannelsUrls = await this.getFeaturedChannelIds(
      selectedChannelId
    ).catch((err) =>
      errorLogger(new Error(err), LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    )

    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet',
      maxResults: 50,
      id: [...featuredChannelsUrls, selectedChannelId].join(','),
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getAllHololiveMembersDetail(
    region?: 'id' | 'jp'
  ): Promise<youtube_v3.Schema$Channel[]> {
    const selectedChannelId =
      region && region === 'id'
        ? this.ayundaRisuChannelId
        : this.hololiveOfficialChannelId

    const featuredChannelsUrls = await this.getFeaturedChannelIds(
      selectedChannelId
    ).catch((err) =>
      errorLogger(new Error(err), LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    )

    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'statistics,brandingSettings,snippet',
      id: [...featuredChannelsUrls, selectedChannelId].join(','),
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getFeaturedChannelIds(
    selectedChannelId: string
  ): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'brandingSettings',
      id: selectedChannelId,
      fields: 'items(brandingSettings(channel(featuredChannelsUrls)))',
    }

    const { data } = await this.youtubeChannel.list(getChannelsOptions)

    const featuredChannelsUrls =
      data?.items[0]?.brandingSettings?.channel?.featuredChannelsUrls

    if (!featuredChannelsUrls?.length)
      throw new Error('Cannot find any related channels from Hololive Official')

    return featuredChannelsUrls
  }

  public static async getSelectedChannelDetail(
    channelId: string
  ): Promise<youtube_v3.Schema$Channel> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet,brandingSettings,statistics',
      id: channelId,
      maxResults: 1,
      fields:
        'items(id,snippet(title,description,publishedAt,thumbnails(high(url))),brandingSettings(channel(profileColor),image(bannerTvHighImageUrl)),statistics)',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length)
      throw new Error('**Something went wrong, please try again**')

    return data.items[0]
  }
}
