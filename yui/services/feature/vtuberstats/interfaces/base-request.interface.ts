import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface'

export interface IBaseRequestService<T> {
  getChannelList: (region: T) => Promise<IYoutubeChannel[]>
  getAllMembersChannelDetail: (region?: T) => Promise<IYoutubeChannel[]>
}
