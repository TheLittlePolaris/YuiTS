import type { Message, Client, GuildMember } from 'discord.js'
import type { MessageHandler } from '@/handlers/message.handler'
import type { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { errorLogger, debugLogger } from '@/handlers/error.handler'
import { Yui } from './decorators/yui.decorator'

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
      'MESSAGE_REACTION_REMOVE'
    ]
  }
})
export default class YuiCore {
  private yui: Client
  private messageHandler: MessageHandler
  private voiceStateHandler: VoiceStateHandler
  constructor() {
    debugLogger('YuiCore')
  }

  public async start(): Promise<void> {
    console.log('Connecting...')
    this.yui.login(this['token']).catch(this.coreHandleError)
    this.yui.on('ready', () => this.onReady())
    this.yui.on('message', (message: Message) => this.onMessage(message))
    // this.yui.on("message", this.onMessage.bind(this));
    // prevent ContextChanging. Context will change if call this.onMessage without binding to the current 'this' context
    this.yui.on(
      'voiceStateUpdate',
      (oldMember: GuildMember, newMember: GuildMember) =>
        this.onVoiceStateUpdate(oldMember, newMember)
    )
  }

  async onReady() {
    if (!this.yui.user) return
    console.log('Connected!')
     await Promise.all([this.yui?.user
      ?.setActivity('📻 Radio Happy', {
        url: 'https://twitch.tv/onlypolaris',
        type: 'STREAMING'
      })])
      .catch(this.coreHandleError)
    console.log('Yui is online')
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
      return this.messageHandler.execute(this.yui.user, message, command, args)
    } catch (err) {
      this.coreHandleError(err)
    }
  }

  async onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember) {
    // TODO: check this
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldMember, newMember)
  }

  private coreHandleError(error: Error | string): null {
    return errorLogger(error, 'YUI_CORE')
  }
}
