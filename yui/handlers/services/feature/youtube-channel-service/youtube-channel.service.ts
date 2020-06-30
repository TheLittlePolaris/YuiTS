import { google, youtube_v3 } from 'googleapis'
import { LOG_SCOPE } from '@/constants/constants'
import { IYoutubeChannel } from '../feature-interfaces/youtube-channel.interface'
import { errorLogger } from '@/handlers/log.handler'

export abstract class YoutubeChannelService {
  static youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: global?.config?.youtubeApiKey,
  })

  static youtubeChannel = YoutubeChannelService.youtube.channels

  public static async getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet',
      maxResults: 50,
      id: channelIds.join(','),
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'statistics,brandingSettings,snippet',
      id: channelIds.join(','),
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getFeaturedChannelIds(selectedChannelId: string): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'brandingSettings',
      id: selectedChannelId,
      fields: 'items(brandingSettings(channel(featuredChannelsUrls)))',
    }

    const { data } = await this.youtubeChannel.list(getChannelsOptions)

    const featuredChannelsUrls = data?.items[0]?.brandingSettings?.channel?.featuredChannelsUrls

    if (!featuredChannelsUrls?.length) throw new Error('Cannot find any related channels from Hololive Official')

    return featuredChannelsUrls
  }

  public static async getSelectedChannelDetail(channelId: string): Promise<IYoutubeChannel> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet,brandingSettings,statistics',
      id: channelId,
      maxResults: 1,
      fields:
        'items(id,snippet(title,description,publishedAt,thumbnails(high(url))),brandingSettings(channel(profileColor),image(bannerTvHighImageUrl)),statistics)',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('**Something went wrong, please try again**')

    return data.items[0]
  }
}
