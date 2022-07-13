import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface'
import { HoloStatRegions, KnownHoloStatRegions } from './holostat.interface'
import { BaseRequestService } from '../channel-service/base-request.service'
import { YoutubeChannelService } from '../channel-service/youtube-channel.service'
import { Injectable } from 'djs-ioc-container'
import { YuiLogger } from '@/services/logger'

@Injectable()
export class HoloStatRequestService implements BaseRequestService<KnownHoloStatRegions> {
  private featuredChannels: { [key in KnownHoloStatRegions]: string } = {
    [HoloStatRegions.Japan]: 'UCJFZiqLMntJufDCHc6bQixg.aqsRo9JYx5M',
    [HoloStatRegions.Indonesia]: 'UCfrWoRGlawPQDQxxeIDRP0Q.iJLXf_7B368',
    [HoloStatRegions.English]: 'UCotXwY6s8pWmuWd_snKYjhg.LeAltgu_pbM'
  }

  constructor(private youtubeChannelService: YoutubeChannelService) {}

  public async getChannelList(region: KnownHoloStatRegions): Promise<IYoutubeChannel[]> {
    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region]
    )

    if (!featuredChannelIds) return this.handleError('No featured channels')

    return await this.youtubeChannelService.getChannelList([
      ...featuredChannelIds,
      this.featuredChannels[region]
    ])
  }

  public async getAllMembersChannelDetail(region?: KnownHoloStatRegions) {
    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region]
    )

    if (!featuredChannelIds) return this.handleError('No featured channels')
    return this.youtubeChannelService.getAllMembersChannelDetail([
      ...featuredChannelIds,
      this.featuredChannels[region]
    ])
  }
  public async getSelectedChannelDetail(channelId: string) {
    return await this.youtubeChannelService.getSelectedChannelDetail(channelId)
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
