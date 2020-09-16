import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { Message, VoiceState } from 'discord.js'
import { LOG_SCOPE } from './constants/constants'
import { Yui, On, EventMessage, EventVoiceState } from './decorators/yui.decorator'
import { YuiClient } from './yui-client'
import { EntryComponent } from './dep-injection-ioc/interfaces/di-interfaces'
import { Inject } from './dep-injection-ioc/decorators'
import { YuiLogger } from './log/logger.service'

@Yui()
export class YuiCore implements EntryComponent {
  constructor(
    private yui: YuiClient,
    private messageHandler: MessageHandler,
    private voiceStateHandler: VoiceStateHandler,
    @Inject('BOT_TOKEN') private token: string,
    @Inject('BOT_PREFIX') private prefix: string
  ) {
    YuiLogger.debug('Created!', LOG_SCOPE.YUI_CORE)
  }

  public async start(): Promise<void> {
    YuiLogger.log('Connecting... 📡', LOG_SCOPE.YUI_CORE)
    this.yui.login(this.token)
  }

  @On('ready')
  async onReady(): Promise<void> {
    if (!this.yui || !this.yui.user)
      throw new Error('Something went horribly wrong! Client is not defined!')
    YuiLogger.log('🔗 🛰 Connected!', LOG_SCOPE.YUI_CORE)
    await Promise.all([
      global.config.environment === 'development'
        ? this.yui.user.setActivity(`${this.prefix}help`, {
            type: 'LISTENING',
          })
        : this.yui.user.setActivity(`📻 Radio Happy (${this.prefix}help)`, {
            url: 'https://twitch.tv/onlypolaris',
            type: 'STREAMING',
          }),
    ]).catch((err) => this.handleError(new Error(err)))
    YuiLogger.log('🚀 🔶Yui is online! 🚀', LOG_SCOPE.YUI_CORE)
  }

  @On('message')
  async onMessage(@EventMessage() message: Message): Promise<unknown> {
    try {
      if (message.channel.type === 'dm' && message.author.id === global.config.ownerId)
        return this.onDM(message)

      if (
        !message.content.startsWith(this.prefix) ||
        message.author.bot ||
        message.channel.type !== 'text'
      )
        return

      const args = message.content.slice(this.prefix.length).trim().split(/ +/g)

      const command = args.shift()

      return this.messageHandler.messageSwitchMap(message, command, args)
    } catch (err) {
      this.handleError(new Error(err))
    }
  }

  async onDM(message: Message): Promise<void> {
    return this.messageHandler.specialExecute(message)
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    @EventVoiceState('old') oldVoiceState: VoiceState,
    @EventVoiceState('new') newVoiceState: VoiceState
  ): Promise<void> {
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldVoiceState, newVoiceState)
  }

  get client() {
    return this.yui
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.YUI_CORE)
    return null
  }
}
