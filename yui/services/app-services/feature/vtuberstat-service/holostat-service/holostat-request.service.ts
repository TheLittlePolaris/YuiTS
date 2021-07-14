import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { HOLO_KNOWN_REGION } from './holostat.interface'
import { BaseRequestService } from '../channel-service/base-request.service'
import { YoutubeChannelService } from '../channel-service/youtube-channel.service'
import { Injectable } from '@/dep-injection-ioc/decorators'
import { YuiLogger } from '@/log/logger.service'
import { LOG_SCOPE } from '@/constants/constants'

@Injectable()
export class HoloStatRequestService implements BaseRequestService<HOLO_KNOWN_REGION> {
  private featuredChannels: { [key: string]: string | string[] } = {
    jp: 'UCJFZiqLMntJufDCHc6bQixg.aqsRo9JYx5M',
    id: 'UCfrWoRGlawPQDQxxeIDRP0Q.iJLXf_7B368',
    en: 'UCotXwY6s8pWmuWd_snKYjhg.LeAltgu_pbM',
  }

  constructor(
    private youtubeChannelService: YoutubeChannelService
  ) {
    YuiLogger.info('Created!', LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
  }

  public async getChannelList(region: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region] as string
    )

    if (!featuredChannelIds) return this.handleError('No featured channels')

    return await this.youtubeChannelService.getChannelList([
      ...featuredChannelIds,
      this.featuredChannels[region] as string,
    ])
  }

  public async getAllMembersChannelDetail(
    region?: HOLO_KNOWN_REGION
  ) {


    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region] as string
    )

    if (!featuredChannelIds) return this.handleError('No featured channels')
    return this.youtubeChannelService.getAllMembersChannelDetail([
      ...featuredChannelIds,
      this.featuredChannels[region] as string,
    ])
  }
  public async getSelectedChannelDetail(
    channelId: string
  ) {
    return await this.youtubeChannelService.getSelectedChannelDetail(channelId)
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    return null
  }
}