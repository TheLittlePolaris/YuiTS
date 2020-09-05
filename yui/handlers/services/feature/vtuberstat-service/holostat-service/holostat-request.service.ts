import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { HOLO_KNOWN_REGION } from './holostat.interface'
import { BaseRequestService } from '../channel-service/base-request.service'
import { BilibiliChannelService } from '../channel-service/bilibili-channel.service'
import { YoutubeChannelService } from '../channel-service/youtube-channel.service'
import { debugLogger } from '@/handlers/log.handler'
import { Injectable } from '@/dep-injection-ioc/decorators'

@Injectable()
export class HoloStatRequestService implements BaseRequestService<HOLO_KNOWN_REGION> {
  public hololiveOfficialChannelId = 'UCJFZiqLMntJufDCHc6bQixg' // default, hololive japan
  public ayundaRisuChannelId = 'UCOyYb1c43VlX9rc_lT6NKQw' // hololive indonesia, risu ch
  public hololiveBilibiliIds = ['456368455', '354411419', '427061218', '511613156', '511613155', '511613157'] // hololive China

  constructor(
    private bilibiliChannelService: BilibiliChannelService,
    private youtubeChannelService: YoutubeChannelService
  ) {
    debugLogger(this.constructor.name)
  }

  public async getChannelList(region: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await this.bilibiliChannelService.getChannelList(this.hololiveBilibiliIds)
      case 'id': {
        const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(this.ayundaRisuChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await this.youtubeChannelService.getChannelList([...featuredChannelIds, this.ayundaRisuChannelId])
      }
      case 'jp':
      default: {
        const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
          this.hololiveOfficialChannelId
        )
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await this.youtubeChannelService.getChannelList([...featuredChannelIds, this.hololiveOfficialChannelId])
      }
    }
  }

  public async getAllMembersChannelDetail(region?: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await this.bilibiliChannelService.getAllMembersChannelDetail(this.hololiveBilibiliIds)
      case 'id': {
        const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(this.ayundaRisuChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await this.youtubeChannelService.getAllMembersChannelDetail([
          ...featuredChannelIds,
          this.ayundaRisuChannelId,
        ])
      }
      case 'jp':
      default: {
        const featuredChannelIds = await this.youtubeChannelService.getFeaturedChannelIds(
          this.hololiveOfficialChannelId
        )
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await this.youtubeChannelService.getAllMembersChannelDetail([
          ...featuredChannelIds,
          this.hololiveOfficialChannelId,
        ])
      }
    }
  }
  public async getSelectedChannelDetail(channelId: string, isBilibili: boolean): Promise<IYoutubeChannel> {
    if (isBilibili) return await this.bilibiliChannelService.getSelectedChannelDetail(channelId)
    else return await this.youtubeChannelService.getSelectedChannelDetail(channelId)
  }
}
