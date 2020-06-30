import { YoutubeChannelService } from '../../youtube-channel-service/youtube-channel.service'
import { BilibiliChannelService } from '../../bilibili-channel-service/bilibili-channel.service'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'

export abstract class ChannelDetailService {
  public static async getSelectedChannelDetail({
    channelId,
    isBilibili,
  }: {
    channelId: string
    isBilibili: boolean
  }): Promise<IYoutubeChannel> {
    if (isBilibili) return await BilibiliChannelService.getSelectedChannelDetail(channelId)
    else return await YoutubeChannelService.getSelectedChannelDetail(channelId)
  }
}
