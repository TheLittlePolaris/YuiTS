import { google, youtube_v3 } from 'googleapis'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { BaseChannelService } from './base-channel.service'
import { Injectable, Inject } from '@/dep-injection-ioc/decorators'
import { INJECT_TOKEN } from '@/dep-injection-ioc/constants/di-connstants'
import { YuiLogger } from '@/log/logger.service'
import { LOG_SCOPE } from '@/constants/constants'
import clientSecret from '@/YuiTS_Client_Secrets.json'
import { GoogleAuth, OAuth2Client, OAuth2ClientOptions } from 'google-auth-library'
import { join } from 'path'

@Injectable()
export class YoutubeChannelService implements BaseChannelService {
  constructor(@Inject(INJECT_TOKEN.YOUTUBE_API_KEY) private youtubeApiKey: string) {
    YuiLogger.debug(`Created!`, LOG_SCOPE.YOUTUBE_CHANNEL_SERVICE)
  }

  // private authOptions: OAuth2ClientOptions = {
  //   clientId: '385867104494-urp77ghsl3ef62u78pna2l68s3m2mo9v.apps.googleusercontent.com',
  //   // project_id: 'yui-ts',
  //   // auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  //   // token_uri: 'https://oauth2.googleapis.com/token',
  //   // auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  //   clientSecret: 'zO-DLM2oY1gnEvh5CFyEG194',
  // }

  // private googleOauth2Client = new OAuth2Client(this.authOptions)

  // private googleAuth: GoogleAuth = new GoogleAuth({
  //   keyFilename: join(__dirname,`../../../../../YuiTS_Client_Secrets.json`),
  //   // clientOptions: this.authOptions,
  //   scopes: ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.readonly"]
  // })

  private options: youtube_v3.Options = {
    version: 'v3',
    auth: this.youtubeApiKey,
    
  }

  private youtube: youtube_v3.Youtube = google.youtube(this.options)

  private youtubeChannel = this.youtube.channels
  private youtubeSubscriptions = this.youtube.subscriptions
  // TODO: change featured channel id into subscription
  // pert: snippet, fields: items(snippet(resourceId(channelId)))

  public async getChannelList(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet'],
      maxResults: 100,
      id: channelIds,
      fields: 'items(id,snippet(title))',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)
    if (!data?.items?.length) return this.handleError('Cannot get any data')

    return data.items
  }

  public async getAllMembersChannelDetail(channelIds: string[]): Promise<IYoutubeChannel[]> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelIds,
      maxResults: 100,
      fields:
        'items(id,brandingSettings(image(bannerExternalUrl)),statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails(medium)))',
    }

    const { data, ...others } = await this.youtubeChannel.list(getDataOptions)
    // console.log(data, others)
    if (!data?.items?.length) return this.handleError('Cannot get any data')

    return data.items
  }

  // private async getToken() {
  //   return await this.googleAuth.getClient()
  // }

  public async getFeaturedChannelIds(selectedChannelId: string): Promise<string[]> {
    // console.log(await this.getToken())
    const getChannelsOptions: youtube_v3.Params$Resource$Subscriptions$List = {
      part: ['snippet'],
      channelId: selectedChannelId,
      fields: 'items(snippet(resourceId(channelId)))',
      maxResults: 100
    }

    const { data } = await this.youtubeSubscriptions.list(getChannelsOptions)

    const featuredChannelsUrls = data?.items.map((item) => item.snippet.resourceId.channelId)

    if (!featuredChannelsUrls?.length)
      return this.handleError('Cannot find any related channels from Hololive Official')


    return featuredChannelsUrls
  }

  public async getSelectedChannelDetail(...channelId: string[]): Promise<IYoutubeChannel> {
    const getDataOptions: youtube_v3.Params$Resource$Channels$List = {
      part: ['statistics', 'brandingSettings', 'snippet'],
      id: channelId,
      maxResults: 1,
      fields:
        'items(id,snippet(title,description,publishedAt,thumbnails(high(url))),brandingSettings(channel(profileColor),image(bannerExternalUrl)),statistics)',
    }

    const { data } = await this.youtubeChannel.list(getDataOptions)

    if (!data?.items?.length) return this.handleError('**Something went wrong, please try again**')

    return data.items[0]
  }

  private handleError(error: Error | string) {
    YuiLogger.error(error, LOG_SCOPE.YOUTUBE_CHANNEL_SERVICE)
    return null
  }
}
