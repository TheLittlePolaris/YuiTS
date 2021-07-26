import { TextMessageHandler } from '@/event-handlers/message.handler'
import { VoiceStateHandler } from '@/event-handlers/voice-state.handler'
import { Message, VoiceState } from 'discord.js'
import { LOG_SCOPE } from '../constants/constants'
import { Entrypoint, On, EventMessage, EventVoiceState } from '../ioc-container/decorators/entrypoint.decorator'
import { YuiClient } from '../custom-classes/yui-client'
import { YuiLogger } from '../services/logger/logger.service'
import { ConfigService } from '../config-service/config.service'
import { EntrypointComponent } from '@/ioc-container/entrypoint/entrypoint.component'

@Entrypoint()
export class YuiCore extends EntrypointComponent {
  constructor(
    private yui: YuiClient,
    private voiceStateHandler: VoiceStateHandler,
    private configService: ConfigService,
    ) {
    super(yui, configService.token)
    YuiLogger.info('Created!', LOG_SCOPE.YUI_CORE)
  }

  @On('ready')
  async onReady(): Promise<void> {
   
    if (!this.yui || !this.yui.user)
      throw new Error('Something went horribly wrong! Client is not defined!')
    YuiLogger.log('🔗 🛰 Connected!', LOG_SCOPE.YUI_CORE)
    await Promise.all([
      this.configService.environment === 'development'
        ? this.yui.user.setActivity(`${this.configService.prefix}help`, {
            type: 'LISTENING',
          })
        : this.yui.user.setActivity(`📻 Radio Happy (${this.configService.prefix}help)`, {
            url: 'https://twitch.tv/onlypolaris',
            type: 'STREAMING',
          }),
    ]).catch((err) => this.handleError(err))
    YuiLogger.log('🚀 🔶Yui is online! 🚀', LOG_SCOPE.YUI_CORE)
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    @EventVoiceState('old') oldVoiceState: VoiceState,
    @EventVoiceState('new') newVoiceState: VoiceState
  ): Promise<void> {
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldVoiceState, newVoiceState)
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.YUI_CORE)
    return null
  }
}
