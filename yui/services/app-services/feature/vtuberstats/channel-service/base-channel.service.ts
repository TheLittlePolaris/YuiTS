import { IYoutubeChannel } from '../../interfaces/youtube-channel.interface'

export abstract class BaseChannelService {
  public abstract getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]>

  public abstract getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]>

  public abstract getFeaturedChannelIds(...selectedChannelId: string[]): Promise<string[]>

  public abstract getSelectedChannelDetail(...channelId: string[]): Promise<IYoutubeChannel>
}
