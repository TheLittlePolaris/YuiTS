import { Message, Client, GuildMember } from 'discord.js'
import type { MessageHandler } from '@/handlers/message.handler'
import type { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { errorLogger, debugLogger, infoLogger } from '@/handlers/log.handler'
import { Yui, On } from './decorators/yui.decorator'
import { LOG_SCOPE } from './constants/constants'

@Yui({
  prefix: global?.config?.prefix,
  token: global?.config?.token,
  options: {
    disableEveryone: true,
    disabledEvents: [
      'TYPING_START',
      'MESSAGE_REACTION_ADD',
      'RELATIONSHIP_ADD',
      'RELATIONSHIP_REMOVE',
      'MESSAGE_REACTION_REMOVE',
    ],
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
      (oldMember: GuildMember, newMember: GuildMember) =>
        this.onVoiceStateUpdate(oldMember, newMember)
    )
  }

  @On('ready')
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

  @On('message')
  async onMessage(message: Message) {
    if (!message.content?.startsWith(this['prefix']) || message.author.bot)
      return

    const args = message.content
      .slice(this['prefix']?.length)
      .trim()
      .split(/ +/g)

    const command = args.shift().toLowerCase()

    try {
      return this.messageHandler.execute(this.yui.user, message, command, args)
    } catch (err) {
      this.handleError(err)
    }
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember) {
    // TODO: Fix this
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldMember, newMember)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.YUI_CORE)
  }
}
