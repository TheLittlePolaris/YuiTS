import bilibili from 'bili-api'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { Constants } from '@/constants/constants'
import { errorLogger } from '@/handlers/log.handler'
import { BaseChannelService } from './base-channel.service'

export abstract class BilibiliChannelService implements BaseChannelService {
  public static async getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const results = await Promise.all(channelIds.map((id) => bilibili({ mid: id }, ['info'])))
    const data = results.map(this.mapToYoutubeChannel)
    return data
  }

  public static async getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const results = await Promise.all(
      channelIds.map((id) => bilibili({ mid: id }, ['follower', 'title', 'video', 'info', 'archiveView']))
    ).catch((err) => this.handleError(err))
    if (!results) return []
    const channelData = results.map(this.mapToYoutubeChannel)
    return channelData
  }

  public static async getSelectedChannelDetail(channelId: string): Promise<IYoutubeChannel> {
    const result = await bilibili({ mid: channelId }, [
      'follower',
      'title',
      'video',
      'info',
      'archiveView',
    ]).catch((err) => this.handleError(err))
    if (!result) return null
    return this.mapToYoutubeChannel(result)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private static mapToYoutubeChannel = ({
    mid,
    follower,
    info,
    getRoomInfoOld,
    title,
    video,
    navnum,
    archiveView,
  }): IYoutubeChannel => ({
    id: mid || '',
    snippet: {
      title: info?.data?.name || '',
      publishedAt: new Date().toISOString(),
      description: info.data.sign,
      thumbnails: {
        high: {
          url: info?.data?.face || '',
        },
      },
    },
    statistics: {
      viewCount: archiveView || 0,
      videoCount: video || 0,
      subscriberCount: follower || 0,
    },
    brandingSettings: {
      image: {
        bannerTvHighImageUrl: info?.data?.top_photo || '',
      },
      channel: {
        profileColor: Constants.YUI_COLOR_CODE,
      },
    },
    bilibiliRoomInfo: {
      roomid: getRoomInfoOld?.data?.roomid,
      title,
      url: getRoomInfoOld?.data?.url || '',
    },
  })

  private static handleError(error: Error | string): null {
    return errorLogger(error)
  }
}
