// import { Discord, Client as TypeITClient, On } from "@typeit/discord";
import { Message, Client, ClientOptions, GuildMember } from 'discord.js';
import { MessageHandler } from './handlers/message.handler';
import { VoiceStateHandler } from './handlers/voice-state.handler';
import { errorLogger, debugLogger } from './handlers/error.handler';
import { ConfigService } from './config-services/config.service';

// @Discord
export default class YuiCore {
  private yui: Client;
  private messageHandler: MessageHandler;
  private voiceStateHandler: VoiceStateHandler;
  private prefix = ConfigService.prefix;

  constructor() {
    const clientOptions: ClientOptions = {
      disableEveryone: true,
      disabledEvents: [
        'TYPING_START',
        'MESSAGE_REACTION_ADD',
        'RELATIONSHIP_ADD',
        'RELATIONSHIP_REMOVE',
        'MESSAGE_REACTION_REMOVE'
      ]
    };
    this.yui = new Client(clientOptions);
    this.messageHandler = new MessageHandler();
    this.voiceStateHandler = new VoiceStateHandler(
      this.messageHandler.musicService || null
    );
    debugLogger('YuiCore');
  }

  public async start(): Promise<void> {
    console.log('Connecting...');
    this.yui
      .login(ConfigService.envConfig['TOKEN'])
      .catch(this.coreHandleError);
    this.yui.on('ready', () => this.onReady());
    this.yui.on('message', (message: Message) => this.onMessage(message));
    // this.yui.on("message", this.onMessage.bind(this));
    // prevent ContextChanging. Context will change if call this.onMessage without binding to the current 'this' context
    this.yui.on(
      'voiceStateUpdate',
      (oldMember: GuildMember, newMember: GuildMember) =>
        this.onVoiceStateUpdate(oldMember, newMember)
    );
  }

  // @On("ready") // This does not work
  async onReady() {
    if (!this.yui.user) return;
    console.log('Connected!');
    const ready = this.yui.user
      .setActivity('📻 Radio Happy', {
        url: 'https://twitch.tv/onlypolaris',
        type: 'STREAMING'
      })
      .catch(this.coreHandleError);
    if (ready) console.log('Yui is ready');
  }

  async onMessage(message: Message) {
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;
    const args = message.content
      .slice(this.prefix.length)
      .trim()
      .split(/ +/g);
    const command = args.shift().toLowerCase();
    return this.messageHandler
      .execute(this.yui.user, message, command, args)
      .catch(this.coreHandleError);
  }

  // @On("voiceStateUpdate") // This does not work either
  async onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember) {
    // TODO: check this
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldMember, newMember);
  }

  private coreHandleError(error: Error | string): null {
    return errorLogger(error, 'YUI_CORE');
  }
}
