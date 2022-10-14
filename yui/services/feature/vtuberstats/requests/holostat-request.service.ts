import { Injectable } from '@tlp01/djs-ioc-container';

import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface';
import { HoloStatRegions, KnownHoloStatRegions } from '../interfaces/holostat.interface';
import { IBaseRequestService } from '../interfaces';

import { YoutubeChannelService } from './youtube-channel.service';

import { YuiLogger } from '@/logger/logger.service';

@Injectable()
export class HoloStatRequestService implements IBaseRequestService<KnownHoloStatRegions> {
  private readonly featuredChannels: { [key in KnownHoloStatRegions]: string } = {
    [HoloStatRegions.Japan]: 'UCJFZiqLMntJufDCHc6bQixg.aqsRo9JYx5M',
    [HoloStatRegions.Indonesia]: 'UCfrWoRGlawPQDQxxeIDRP0Q.iJLXf_7B368',
    [HoloStatRegions.English]: 'UCotXwY6s8pWmuWd_snKYjhg.LeAltgu_pbM'
  };

  constructor(private readonly youtubeChannelService: YoutubeChannelService) {}

  public async getChannelList(region: KnownHoloStatRegions): Promise<IYoutubeChannel[]> {
    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region]
    );

    if (!featuredChannelIds) return this.handleError('No featured channels');

    return this.youtubeChannelService.getChannelList([
      ...featuredChannelIds,
      this.featuredChannels[region]
    ]);
  }

  public async getAllMembersChannelDetail(region?: KnownHoloStatRegions) {
    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region]
    );

    if (!featuredChannelIds) return this.handleError('No featured channels');

    return this.youtubeChannelService.getAllMembersChannelDetail([
      ...featuredChannelIds,
      this.featuredChannels[region]
    ]);
  }
  public async getSelectedChannelDetail(channelId: string) {
    return this.youtubeChannelService.getSelectedChannelDetail(channelId);
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, this.constructor.name);
    return null;
  }
}
