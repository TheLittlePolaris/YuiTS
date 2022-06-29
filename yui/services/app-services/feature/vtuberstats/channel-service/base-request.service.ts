import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface'

export abstract class BaseRequestService<T> {
  constructor() {}

  public async getChannelList(region: T): Promise<IYoutubeChannel[]> {
    return Promise.resolve([])
  }

  public async getAllMembersChannelDetail(region?: T): Promise<IYoutubeChannel[]> {
    return Promise.resolve([])
  }
}
