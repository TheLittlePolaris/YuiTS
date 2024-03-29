import { google, youtube_v3 } from 'googleapis';
import { Injectable } from '@tlp01/djs-ioc-container';

import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface';
import { IBaseChannelService } from '../interfaces/base-channel.interface';

import { YuiLogger } from '@/logger/logger.service';
import { ConfigService } from '@/config-service/config.service';

@Injectable()
export class YoutubeChannelService implements IBaseChannelService {
  constructor(private readonly configService: ConfigService) {}

  private readonly youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: this.configService.youtubeApiKey
  });

  private readonly youtubeChannel = this.youtube.channels;
  private readonly youtubeChannelSections = this.youtube.channelSections;
  public async getChannelList(channelIds: string[]) {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet'],
      maxResults: 50,
      id: channelIds,
      fields: 'items(id,snippet(title))'
    };

    const { data } = await this.youtubeChannel.list(getDataOptions);
    if (!data?.items?.length) return this.handleError('Cannot get any data');

    return data.items;
  }

  public async getAllMembersChannelDetail(channelIds: string[]) {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelIds,
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))'
    };

    const { data } = await this.youtubeChannel.list(getDataOptions);

    if (!data?.items?.length) return this.handleError('Cannot get any data');

    return data.items;
  }

  public async getFeaturedChannelIds(...selectedSectionId: string[]): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['contentDetails'],
      id: selectedSectionId,
      fields: 'items(contentDetails(channels))'
    };

    const { data } = await this.youtubeChannelSections.list(getChannelsOptions);
    // TODO:
    const featuredChannelsUrls = data?.items[0]?.contentDetails.channels;
    if (!featuredChannelsUrls?.length)
      return this.handleError('Cannot find any related channels from Hololive Official');

    return featuredChannelsUrls;
  }

  public async getSelectedChannelDetail(...channelId: string[]): Promise<IYoutubeChannel> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelId,
      maxResults: 1,
      fields:
        'items(id,snippet(title,description,publishedAt,thumbnails(high(url))),brandingSettings(channel(profileColor),image(bannerTvHighImageUrl)),statistics)'
    };

    const { data } = await this.youtubeChannel.list(getDataOptions);

    if (!data?.items?.length) return this.handleError('**Something went wrong, please try again**');

    return data.items[0];
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, this.constructor.name);
    return null;
  }
}
