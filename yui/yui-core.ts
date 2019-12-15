import "reflect-metadata";
import "dotenv";
import { Discord, On, Client } from "@typeit/discord";
import {
  Message,
  Client as DiscordClient,
  ClientOptions,
  GuildMember
} from "discord.js";
import Constants from "./constants/constants";
import { MessageHandler } from "./handlers/message.handler";
import { VoiceStateHandler } from "./handlers/voice-state.handler";

@Discord
export class YuiCore {
  private yui: DiscordClient;
  private messageHandler: MessageHandler;
  private voiceStateHandler: VoiceStateHandler;
  private prefix = Constants.PREFIX;

  constructor() {
    const clientOptions: ClientOptions = {
      disableEveryone: true,
      disabledEvents: [
        "TYPING_START",
        "MESSAGE_REACTION_ADD",
        "RELATIONSHIP_ADD",
        "RELATIONSHIP_REMOVE",
        "MESSAGE_REACTION_REMOVE"
      ]
    };
    this.yui = new Client(clientOptions);
    this.messageHandler = new MessageHandler();
    this.voiceStateHandler = new VoiceStateHandler(
      this.messageHandler.musicService
    );
  }

  public async start(): Promise<void> {
    this.yui.login(Constants.TOKEN);
    this.yui.on("ready", () => this.onReady());
  }

  @On("ready")
  async onReady() {
    if (!this.yui.user) return;
    const [ready] = await Promise.all([
      this.yui.user
        .setActivity("📻 Radio Happy", {
          url: "https://twitch.tv/onlypolaris",
          type: "STREAMING"
        })
        .catch(err => Promise.resolve(null))
    ]);
    if (ready) console.log("Yui is ready");
  }

  @On("message")
  async onMessage(message: Message) {
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;
    var args = message.content
      .slice(this.prefix.length)
      .trim()
      .split(/ +/g);
    const command = args.shift().toLowerCase();
    return this.messageHandler.execute(message, command, args);
  }

  @On("voiceStateUpdate")
  async onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember) {
    this.voiceStateHandler.checkOnVoiceStateUpdate(oldMember, newMember);
  }
}
