import { google, youtube_v3 } from 'googleapis'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { BaseChannelService } from './base-channel.service'
import { Injectable } from '@/dep-injection-ioc/decorators'
import { YuiLogger } from '@/log/logger.service'
import { LOG_SCOPE } from '@/constants/constants'
import { ConfigService } from '@/config-service/config.service'

@Injectable()
export class YoutubeChannelService implements BaseChannelService {
  constructor(private configService: ConfigService) {
    YuiLogger.info(`Created!`, LOG_SCOPE.YOUTUBE_CHANNEL_SERVICE)
  }

  private youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: this.configService.youtubeApiKey,
  })

  private youtubeChannel = this.youtube.channels
  private youtubeChannelSections = this.youtube.channelSections
  public async getChannelList(channelIds: string[]) {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet'],
      maxResults: 50,
      id: channelIds,
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) return this.handleError('Cannot get any data')
    console.log(data, `<======= data [youtube-channel.service.ts - 32]`);
    return data.items
  }

  public async getAllMembersChannelDetail(channelIds: string[]) {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelIds,
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) return this.handleError('Cannot get any data')
    console.log(data, `<======= data [youtube-channel.service.ts - 48]`);
    return data.items
  }

  public async getFeaturedChannelIds(...selectedSectionId: string[]): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['contentDetails'],
      id: selectedSectionId,
      fields: 'items(contentDetails(channels))',
    }

    const { data } = await this.youtubeChannelSections.list(getChannelsOptions)
    // TODO: 
    const featuredChannelsUrls = data?.items[0]?.contentDetails.channels
    // console.log(data?.items[0]?.contentDetails.channels, `<======= data?.items[0]?.brandingSettings?.channel [youtube-channel.service.ts - 63]`);
    if (!featuredChannelsUrls?.length)
      return this.handleError('Cannot find any related channels from Hololive Official')

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

    if (!data?.items?.length) return this.handleError('**Something went wrong, please try again**')

    return data.items[0]
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, LOG_SCOPE.YOUTUBE_CHANNEL_SERVICE)
    return null
  }
}