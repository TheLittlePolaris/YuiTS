import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface'

export interface IBaseChannelService {
  getAllMembersChannelDetail: (channelIds: string[]) => Promise<IYoutubeChannel[]>
  getChannelList: (channelIds: string[]) => Promise<IYoutubeChannel[]>
  getFeaturedChannelIds: (...selectedChannelId: string[]) => Promise<string[]>
  getSelectedChannelDetail: (...channelId: string[]) => Promise<IYoutubeChannel>
}
