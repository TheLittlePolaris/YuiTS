import { google, youtube_v3 } from 'googleapis'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { BaseChannelService } from './base-channel.service'
import { Injectable, Inject } from '@/dep-injection-ioc/decorators'
import { INJECT_TOKEN } from '@/dep-injection-ioc/constants/di-connstants'

@Injectable()
export class YoutubeChannelService implements BaseChannelService {
  constructor(@Inject(INJECT_TOKEN.YOUTUBE_API_KEY) private youtubeApiKey: string) {}

  private youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: this.youtubeApiKey,
  })

  private youtubeChannel = this.youtube.channels

  public async getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet'],
      maxResults: 50,
      id: channelIds,
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public async getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelIds,
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public async getFeaturedChannelIds(...selectedChannelId: string[]): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['brandingSettings'],
      id: selectedChannelId,
      fields: 'items(brandingSettings(channel(featuredChannelsUrls)))',
    }

    const { data } = await this.youtubeChannel.list(getChannelsOptions)

    const featuredChannelsUrls = data?.items[0]?.brandingSettings?.channel?.featuredChannelsUrls

    if (!featuredChannelsUrls?.length) throw new Error('Cannot find any related channels from Hololive Official')

    return featuredChannelsUrls
  }

  public async getSelectedChannelDetail(...channelId: string[]): Promise<IYoutubeChannel> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
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
