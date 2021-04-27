import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'

export class BaseChannelService {
  public static async getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]> {
    return Promise.resolve([])
  }

  public static async getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]> {
    return Promise.resolve([])
  }

  public static async getFeaturedChannelIds(...selectedChannelId: string[]): Promise<string[]> {
    return Promise.resolve([])
  }

  public static async getSelectedChannelDetail(...channelId: string[]): Promise<IYoutubeChannel> {
    return Promise.resolve({})
  }
}
