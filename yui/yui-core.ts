import { Message, Client, GuildMember, VoiceState } from 'discord.js'
import type { MessageHandler } from '@/handlers/message.handler'
import type { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { errorLogger, debugLogger, infoLogger } from '@/handlers/log.handler'
import { Yui, On } from './decorators/yui.decorator'
import { LOG_SCOPE } from './constants/constants'

@Yui({
  prefix: global?.config?.prefix,
  token: global?.config?.token,
  options: {
    disableMentions: 'everyone',
  },
})
export default class YuiCore {
  private yui: Client
  private messageHandler: MessageHandler
  private voiceStateHandler: VoiceStateHandler
  constructor() {
    debugLogger(LOG_SCOPE.YUI_CORE)
  }

  public async start(): Promise<void> {
    infoLogger(LOG_SCOPE.YUI_CORE, 'Connecting...')

    this.yui
      .login(this['token'])
      .catch((err) => this.handleError(new Error(err)))

    this.yui.on('ready', () => this.onReady())
    this.yui.on('message', (message: Message) => this.onMessage(message))
    // this.yui.on("message", this.onMessage.bind(this));
    this.yui.on(
      'voiceStateUpdate',
      (oldMember: VoiceState, newMember: VoiceState) =>
        this.onVoiceStateUpdate(oldMember, newMember)
    )
  }

  async onReady() {
    if (!this.yui.user) return
    infoLogger(LOG_SCOPE.YUI_CORE, 'Connected!')
    await Promise.all([
      this.yui?.user?.setActivity('📻 Radio Happy', {
        url: 'https://twitch.tv/onlypolaris',
        type: 'STREAMING',
      }),
    ]).catch((err) => this.handleError(new Error(err)))
    infoLogger(LOG_SCOPE.YUI_CORE, 'Yui is online')
  }

  async onMessage(message: Message) {
    if (!message.content?.startsWith(this['prefix']) || message.author.bot)
      return

    const args = message.content
      .slice(this['prefix']?.length)
      .trim()
      .split(/ +/g)

    const command = args.shift().toLowerCase()

    try {
      return this.messageHandler.execute(message, command, args)
    } catch (err) {
      this.handleError(new Error(err))
    }
  }

  async onVoiceStateUpdate(
    oldVoiceState: VoiceState,
    newVoiceState: VoiceState
  ) {
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldVoiceState, newVoiceState)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.YUI_CORE)
  }
}
