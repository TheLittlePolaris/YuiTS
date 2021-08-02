import { VoiceStateHandler } from '@/event-handlers/voice-state.handler'
import { VoiceState } from 'discord.js'
import { LOG_SCOPE } from '../constants/constants'
import { Entrypoint, On, EventVoiceState } from '../ioc-container/decorators/entrypoint.decorator'
import { YuiClient } from '../custom-classes/yui-client'
import { YuiLogger } from '../services/logger/logger.service'
import { ConfigService } from '../config-service/config.service'
import { EntrypointComponent } from '@/ioc-container/entrypoint/entrypoint.component'

@Entrypoint()
export class YuiCore extends EntrypointComponent {
  constructor(private yui: YuiClient, private configService: ConfigService) {
    super(yui, configService.token)
    YuiLogger.info('Created!', LOG_SCOPE.YUI_CORE)
  }
}
