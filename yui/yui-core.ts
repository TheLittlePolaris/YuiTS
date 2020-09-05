import { debugLogger, errorLogger, infoLogger } from '@/handlers/log.handler'
import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { Message, VoiceState } from 'discord.js'
import { LOG_SCOPE } from './constants/constants'
import { Yui, On, EventMessage, EventVoiceState } from './decorators/yui.decorator'
import { YuiClient } from './yui-client'
import { EntryConponent } from './dep-injection-ioc/interfaces/di-interfaces'
import { Inject } from './dep-injection-ioc/decorators'
import { INJECT_TOKEN } from './dep-injection-ioc/constants/di-connstants'

@Yui()
export class YuiCore implements EntryConponent {
  constructor(
    private yui: YuiClient,
    private messageHandler: MessageHandler,
    private voiceStateHandler: VoiceStateHandler,
    @Inject(INJECT_TOKEN.BOT_TOKEN) private token: string,
    @Inject(INJECT_TOKEN.BOT_PREFIX) private prefix: string
  ) {
    debugLogger(LOG_SCOPE.YUI_CORE)
  }

  public async start(): Promise<void> {
    infoLogger(LOG_SCOPE.YUI_CORE, 'Connecting... 📡')
    this.yui.login(this.token).catch((err) => this.handleError(new Error(err)))
  }

  @On('ready')
  async onReady(): Promise<void> {
    if (!this.yui || !this.yui.user) throw new Error('Something went horribly wrong! Client is not defined!')
    infoLogger(LOG_SCOPE.YUI_CORE, '🔗 🛰 Connected!')
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
    infoLogger(LOG_SCOPE.YUI_CORE, '🚀 🔶Yui is online! 🚀')
  }

  @On('message')
  async onMessage(@EventMessage() message: Message): Promise<unknown> {
    try {
      // owner feature
      if (message.channel.type === 'dm' && message.author.id === global.config.ownerId) return this.onDM(message)

      if (!message.content.startsWith(this.prefix) || message.author.bot) return

      if (message.channel.type !== 'text') return // only accept text channel message
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
    return errorLogger(error, LOG_SCOPE.YUI_CORE)
  }
}
