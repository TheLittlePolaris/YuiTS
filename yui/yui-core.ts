import { debugLogger, errorLogger, infoLogger } from '@/handlers/log.handler'
import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { Client, Message, VoiceState } from 'discord.js'
import { LOG_SCOPE } from './constants/constants'
import { Yui } from './decorators/yui.decorator'

@Yui({
  prefix: global?.config?.prefix,
  token: global?.config?.token,
  options: {
    disableMentions: 'everyone',
  },
})
export class YuiCore {
  private yui: Client
  private messageHandler: MessageHandler
  private voiceStateHandler: VoiceStateHandler
  constructor() {
    debugLogger(LOG_SCOPE.YUI_CORE)
  }

  public async start(): Promise<void> {
    infoLogger(LOG_SCOPE.YUI_CORE, 'Connecting...')

    this.yui.login(this['token']).catch((err) => this.handleError(new Error(err)))

    this.yui.on('ready', () => this.onReady())
    this.yui.on('message', (message: Message) => this.onMessage(message))
    // this.yui.on("message", this.onMessage.bind(this));
    this.yui.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) =>
      this.onVoiceStateUpdate(oldState, newState)
    )
  }

  async onReady(): Promise<void> {
    if (!this.yui?.user) return
    infoLogger(LOG_SCOPE.YUI_CORE, 'Connected!')
    await Promise.all([
      global.config.environment === 'development'
        ? this.yui?.user?.setActivity('-help', {
            type: 'LISTENING',
          })
        : this.yui?.user?.setActivity('📻 Radio Happy (>help)', {
            url: 'https://twitch.tv/onlypolaris',
            type: 'STREAMING',
          }),
    ]).catch((err) => this.handleError(new Error(err)))
    infoLogger(LOG_SCOPE.YUI_CORE, 'Yui is online')
  }

  async onMessage(message: Message): Promise<unknown> {
    try {
      // owner feature
      if (message.channel.type === 'dm' && message.author.id === global.config.ownerId) return this.onDM(message)

      if (!message.content.startsWith(this['prefix']) || message.author.bot) return

      if (message.channel.type !== 'text') return // only accept text channel message
      const args = message.content.slice(this['prefix'].length).trim().split(/ +/g)

      const command = args.shift()

      return this.messageHandler.execute(message, command, args)
    } catch (err) {
      this.handleError(new Error(err))
    }
  }

  async onDM(message: Message): Promise<void> {
    return this.messageHandler.specialExecute(message, this.yui)
  }

  async onVoiceStateUpdate(oldVoiceState: VoiceState, newVoiceState: VoiceState): Promise<void> {
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldVoiceState, newVoiceState)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.YUI_CORE)
  }
}
