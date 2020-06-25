import { debugLogger, errorLogger } from '@/handlers/log.handler'
import { google, youtube_v3 } from 'googleapis'
import { LOG_SCOPE, HOLOSTAT_KNOWN_REGION_CODE, Constants } from '@/constants/constants'
import { IYoutubeChannel } from '../feature-interfaces/holostat-channel.interface'
import bilibili from 'bili-api'

export abstract class HoloStatRequestService {
  static youtube: youtube_v3.Youtube = google.youtube({
    version: 'v3',
    auth: global.config.youtubeApiKey,
  })

  static youtubeChannel = HoloStatRequestService.youtube.channels

  constructor() {
    debugLogger('HoloStatService')
  }
  public static hololiveOfficialChannelId = 'UCJFZiqLMntJufDCHc6bQixg' // default, hololive japan
  public static ayundaRisuChannelId = 'UCOyYb1c43VlX9rc_lT6NKQw' // hololive indonesia, risu ch
  public static channelMids = ['456368455', '354411419', '427061218', '511613156', '511613155', '511613157'] // hololive China

  public static async getListChannels(region: HOLOSTAT_KNOWN_REGION_CODE): Promise<IYoutubeChannel[]> {
    if (region === 'cn') return this.getHololiveChinaChannelList()

    const selectedChannelId = region && region === 'id' ? this.ayundaRisuChannelId : this.hololiveOfficialChannelId

    const featuredChannelsUrls = await this.getFeaturedChannelIds(selectedChannelId).catch((err) =>
      errorLogger(new Error(err), LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    )

    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet',
      maxResults: 50,
      id: [...featuredChannelsUrls, selectedChannelId].join(','),
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getAllYoutubeHololiveMembersDetail(
    region?: HOLOSTAT_KNOWN_REGION_CODE
  ): Promise<IYoutubeChannel[]> {
    if (region === 'cn') return await this.getHololiveChinaChannelsStat()
    const selectedChannelId = region && region === 'id' ? this.ayundaRisuChannelId : this.hololiveOfficialChannelId

    const featuredChannelsUrls = await this.getFeaturedChannelIds(selectedChannelId).catch((err) =>
      errorLogger(new Error(err), LOG_SCOPE.HOLOSTAT_REQUEST_SERVICE)
    )

    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'statistics,brandingSettings,snippet',
      id: [...featuredChannelsUrls, selectedChannelId].join(','),
      maxResults: 50,
      fields:
        'items(id,brandingSettings(image(bannerImageUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('Cannot get any data')

    return data.items
  }

  public static async getFeaturedChannelIds(selectedChannelId: string): Promise<string[]> {
    const getChannelsOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'brandingSettings',
      id: selectedChannelId,
      fields: 'items(brandingSettings(channel(featuredChannelsUrls)))',
    }

    const { data } = await this.youtubeChannel.list(getChannelsOptions)

    const featuredChannelsUrls = data?.items[0]?.brandingSettings?.channel?.featuredChannelsUrls

    if (!featuredChannelsUrls?.length) throw new Error('Cannot find any related channels from Hololive Official')

    return featuredChannelsUrls
  }

  public static async getSelectedChannelDetail(channelId: string, isBilibili: boolean): Promise<IYoutubeChannel> {
    if (isBilibili) return await this.getHololiveChinaChannelDetail(channelId)
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: 'snippet,brandingSettings,statistics',
      id: channelId,
      maxResults: 1,
      fields:
        'items(id,snippet(title,description,publishedAt,thumbnails(high(url))),brandingSettings(channel(profileColor),image(bannerTvHighImageUrl)),statistics)',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) throw new Error('**Something went wrong, please try again**')

    return data.items[0]
  }

  public static async getHololiveChinaChannelList(): Promise<IYoutubeChannel[]> {
    const results = await Promise.all(this.channelMids.map((id) => bilibili({ mid: id }, ['info'])))
    const data = results.map(this.mapToYoutubeChannel)
    return data
  }

  public static async getHololiveChinaChannelsStat(): Promise<IYoutubeChannel[]> {
    const results = await Promise.all(
      this.channelMids.map((id) => bilibili({ mid: id }, ['follower', 'title', 'video', 'info', 'archiveView']))
    )
    const channelData = results.map(this.mapToYoutubeChannel)
    return channelData
  }

  public static async getHololiveChinaChannelDetail(channelId: string): Promise<IYoutubeChannel> {
    const result = await bilibili({ mid: channelId }, ['follower', 'title', 'video', 'info', 'archiveView'])
    return this.mapToYoutubeChannel(result)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static mapToYoutubeChannel = ({
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
}
