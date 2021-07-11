import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { HOLO_KNOWN_REGION } from './holostat.interface'
import { BaseRequestService } from '../channel-service/base-request.service'
import { BilibiliChannelService } from '../channel-service/bilibili-channel.service'
import { YoutubeChannelService } from '../channel-service/youtube-channel.service'
import { Injectable } from '@/dep-injection-ioc/decorators'
import { YuiLogger } from '@/log/logger.service'
import { LOG_SCOPE } from '@/constants/constants'

@Injectable()
export class HoloStatRequestService implements BaseRequestService<HOLO_KNOWN_REGION> {
  private featuredChannels: { [key: string]: string | string[] } = {
    jp: 'UCJFZiqLMntJufDCHc6bQixg',
    id: 'UCOyYb1c43VlX9rc_lT6NKQw',
    cn: ['456368455', '354411419', '427061218', '511613156', '511613155', '511613157'],
    en: 'UCotXwY6s8pWmuWd_snKYjhg',
  }

  constructor(
    private bilibiliChannelService: BilibiliChannelService,
    private youtubeChannelService: YoutubeChannelService
  ) {
    YuiLogger.info('Created!', LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
  }

  public async getChannelList(region: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    if (region === 'cn')
      return await this.bilibiliChannelService.getChannelList(
        this.featuredChannels[region] as string[]
      )

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
  ): Promise<IYoutubeChannel[]> {
    if (region === 'cn')
      return await this.bilibiliChannelService.getAllMembersChannelDetail(
        this.featuredChannels[region] as string[]
      )

    const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
      this.featuredChannels[region] as string
    )
    if (!featuredChannelIds) return this.handleError('No featured channels')
    return await this.youtubeChannelService.getAllMembersChannelDetail([
      ...featuredChannelIds,
      this.featuredChannels[region] as string,
    ])
  }
  public async getSelectedChannelDetail(
    channelId: string,
    isBilibili: boolean
  ): Promise<IYoutubeChannel> {
    if (isBilibili)
      return await this.bilibiliChannelService.getSelectedChannelDetail(channelId)
    else return await this.youtubeChannelService.getSelectedChannelDetail(channelId)
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    return null
  }
}
