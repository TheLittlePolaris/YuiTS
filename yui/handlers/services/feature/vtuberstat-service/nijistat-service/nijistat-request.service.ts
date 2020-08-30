import { BilibiliChannelService } from '../channel-service/bilibili-channel.service'
import { YoutubeChannelService } from '../channel-service/youtube-channel.service'
import { NIJI_KNOWN_REGION } from './nijistat.interface'
import { IYoutubeChannel } from '../../feature-interfaces/youtube-channel.interface'
import { BaseRequestService } from '../channel-service/base-request.service'
import { debugLogger } from '@/handlers/log.handler'
import { Injectable } from '@/decorators/dep-injection-ioc/decorators'

@Injectable()
export class NijiStatRequestService implements BaseRequestService<NIJI_KNOWN_REGION> {
  public nijisanJPIds = [
    'UCX7YkU9nEeaoZbkVLVajcMg',
    'UC_a1ZYZ8ZTXpjg9xUY9sj8w',
    'UCdpUojq0KWZCN9bxXnZwz5w',
    'UCwQ9Uv-m8xkE5PzRc7Bqx3Q',
    'UCD-miitqNY3nyukJ4Fnf4_A',
    'UCCVwhI5trmaSxfcze_Ovzfw',
    'UCnRQYHTnRLSF0cLJwMnedCg',
    'UC0g1AE0DOjBYnLhkgoRWN1w',
    'UCkIimWZ9gBJRamKF0rmPU8w',
    'UCoztvTULBYd3WmStqYeoHcA',
    'UCt0clH12Xk1-Ej5PXKGfdPA',
    'UCLO9QDxVL4bnvRRsz6K4bsQ',
    'UCYKP16oMX9KKPbrNgo_Kgag',
    'UCsg-YqdqQ-KFF0LNk23BY4A',
    'UCvmppcdYf4HOv-tFQhHHJMA',
    'UCpnvhOIJ6BN-vPkYU9ls-Eg',
    'UC6oDys1BGgBsIC3WhG1BovQ',
    'UCwokZsOK_uEre70XayaFnzA',
    'UCtpB6Bvhs1Um93ziEDACQ8g',
    'UC_GCs6GARLxEHxy1w40d6VQ',
    'UCBiqkFJljoxAj10SoP2w2Cg',
    'UC48jH1ul-6HOrcSSfoR02fQ',
    'UCmUjjW5zF1MMOhYUwwwQv9Q',
    'UC_4tXjqecqox5Uc05ncxpxg',
    'UC9EjSJ8pvxtvPdxLOElv73w',
    'UCg63a3lk6PNeWhVvMRM_mrQ',
    'UCufQu4q65z63IgE4cfKs1BQ',
    'UCeShTCVgZyq2lsBW9QwIJcw',
    'UCveZ9Ic1VtcXbsyaBgxPMvg',
    'UCXRlIK3Cw_TJIQC5kSJJQMg',
    'UCZ1xuCK1kNmn5RzPYIZop3w',
    'UCHX7YpFG8rVwhsHCx34xt7w',
    'UCGYAYLDE7TZiiC8U6teciDQ',
    'UC9V3Y3_uzU5e-usObb6IE1w',
    'UC-o-E6I3IC2q8sAoAuM6Umg',
    'UCb6ObE-XGCctO3WrjRZC-cw',
    'UCl1oLKcAq93p-pwKfDGhiYQ',
    'UCfki3lMEF6SGBFiFfo9kvUA',
  ]

  public nijisanIDIds = [
    'UCpJtk0myFr5WnyfsmnInP-w',
    'UCA3WE2WRSpoIvtnoVGq4VAw',
    'UCrR7JxkbeLY82e8gsj_I0pQ',
    'UCOmjciHZ8Au3iKMElKXCF_g',
    'UCk5r533QVMgJUdWwqegH2TA',
    'UCyRkQSuhJILuGOuXk10voPg',
  ]

  public nijiCNids = [
    '421267475',
    '420249427',
    '434334701',
    '455916618',
    '455965041',
    '472845978',
    '472821519',
    '477317922',
    '477306079',
    '472877684',
    '477342747',
    '56748733',
  ]

  constructor(
    private bilibiliChannelService: BilibiliChannelService,
    private youtubeChannelService: YoutubeChannelService
  ) {
    debugLogger(this.constructor.name)
  }

  public async getChannelList(region: NIJI_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await this.bilibiliChannelService.getChannelList(this.nijiCNids)
      case 'id':
        return await this.youtubeChannelService.getChannelList(this.nijisanIDIds)
      case 'jp':
      default:
        return await this.youtubeChannelService.getChannelList(this.nijisanJPIds)
    }
  }

  public async getAllMembersChannelDetail(region?: NIJI_KNOWN_REGION): Promise<IYoutubeChannel[]> {
    switch (region) {
      case 'cn':
        return await this.bilibiliChannelService.getAllMembersChannelDetail(this.nijiCNids)
      case 'id':
        return await this.youtubeChannelService.getAllMembersChannelDetail(this.nijisanIDIds)
      case 'jp':
      default:
        return await this.youtubeChannelService.getAllMembersChannelDetail(this.nijisanJPIds)
    }
  }
}
//     'UC22BVlBsZc6ta3Dqz75NU6Q',      'UCt30jJgChL8qeT9VPadidSw', // solo: TODO:
