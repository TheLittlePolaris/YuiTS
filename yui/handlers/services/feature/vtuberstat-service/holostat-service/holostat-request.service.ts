import { google, youtube_v3 } from 'googleapis'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { BilibiliChannelService } from '../../bilibili-channel-service/bilibili-channel.service'
import { YoutubeChannelService } from '../../youtube-channel-service/youtube-channel.service'
import { HOLO_KNOWN_REGION } from './holostat.interface'

export abstract class HoloStatRequestService {
  public static hololiveOfficialChannelId = 'UCJFZiqLMntJufDCHc6bQixg' // default, hololive japan
  public static ayundaRisuChannelId = 'UCOyYb1c43VlX9rc_lT6NKQw' // hololive indonesia, risu ch
  public static hololiveBilibiliIds = ['456368455', '354411419', '427061218', '511613156', '511613155', '511613157'] // hololive China

  public static async getChannelList(region: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await BilibiliChannelService.getChannelList(this.hololiveBilibiliIds)
      case 'id': {
        const featuredChannelIds = await YoutubeChannelService.getFeaturedChannelIds(this.ayundaRisuChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await YoutubeChannelService.getChannelList([...featuredChannelIds, this.ayundaRisuChannelId])
      }
      case 'jp':
      default: {
        const featuredChannelIds = await YoutubeChannelService.getFeaturedChannelIds(this.hololiveOfficialChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await YoutubeChannelService.getChannelList([...featuredChannelIds, this.hololiveOfficialChannelId])
      }
    }
  }

  public static async getAllMembersChannelDetail(region?: HOLO_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await BilibiliChannelService.getAllMembersChannelDetail(this.hololiveBilibiliIds)
      case 'id': {
        const featuredChannelIds = await YoutubeChannelService.getFeaturedChannelIds(this.ayundaRisuChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await YoutubeChannelService.getAllMembersChannelDetail([...featuredChannelIds, this.ayundaRisuChannelId])
      }
      case 'jp':
      default: {
        const featuredChannelIds = await YoutubeChannelService.getFeaturedChannelIds(this.hololiveOfficialChannelId)
        if (!featuredChannelIds) throw new Error('No featured channels')
        return await YoutubeChannelService.getAllMembersChannelDetail([
          ...featuredChannelIds,
          this.hololiveOfficialChannelId,
        ])
      }
    }
  }
  // public static async getSelectedChannelDetail(channelId: string, isBilibili: boolean): Promise<IYoutubeChannel> {
  //   if (isBilibili) return await BilibiliChannelService.getSelectedChannelDetail(channelId)
  //   else return await YoutubeChannelService.getSelectedChannelDetail(channelId)
  // }
}
