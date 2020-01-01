import { Message, ClientUser } from "discord.js";
import { MusicService } from "../services/music.service";
import { AccessControlerHandler } from "./access-controller.handler";
import { debugLogger } from "./error.handler";
import { FeatureService } from "../services/feature.service";
import { AdministrationService } from "../services/administration.service";

export class MessageHandler {
  private _musicService: MusicService;
  private _accessController: AccessControlerHandler;
  private _featureService: FeatureService;
  private _administrationService: AdministrationService;
  constructor() {
    this._musicService = new MusicService();
    this._accessController = new AccessControlerHandler(this._musicService);
    this._featureService = new FeatureService();
    this._administrationService = new AdministrationService();
    debugLogger("MessageHandler");
  }

  public async execute(
    clientUser: ClientUser,
    message: Message,
    command: string,
    args?: Array<string>
  ) {
    switch (command) {
      case "play":
      case "p": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        return guard && (await this._musicService.play(message, args));
      }
      case "playnext":
      case "pnext":
      case "pn": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        return guard && (await this._musicService.addToNext(message, args));
      }
      case "skip":
      case "next": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.skipSongs(message, args));
      }
      case "join":
      case "come": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        return (
          guard &&
          message.channel.send(
            " :loudspeaker: Kawaii **Yui-chan** is here~! xD"
          )
        );
      }
      case "leave":
      case "bye": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.leaveVoiceChannel(message));
      }
      case "np":
      case "nowplaying": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return (
          guard && this.musicService.getNowPlayingData(message, clientUser)
        );
      }
      case "queue":
      case "q": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && this._musicService.printQueue(message, args);
      }
      case "pause": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return (
          guard && (await this._musicService.musicController(message, true))
        );
      }
      case "resume": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return (
          guard && (await this._musicService.musicController(message, false))
        );
      }
      case "stop": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && this._musicService.stopPlaying(message);
      }
      case "loop": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.loopSettings(message, args));
      }
      case "shuffle": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.shuffleQueue(message));
      }
      case "remove": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.removeSongs(message, args));
      }
      case "clear": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        return guard && (await this._musicService.clearQueue(message));
      }
      case "search": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        return guard && (await this._musicService.searchSong(message, args));
        break;
      }
      case "autoplay":
      case "ap": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        return guard && (await this._musicService.autoPlay(message));
      }
      //end of music command batch
      case "ping": {
        return this._featureService.getPing(message, clientUser.client.pings);
      }
      case "say": {
        return this._featureService.say(message, args);
      }
      case "tenor": {
        return this._featureService.tenorGif(message, args);
      }
      case "admin": {
        message
          .delete()
          .then(sent => {
            // utilCommands.adminCommands(sent, args);
          })
          .catch(err => {
            message.author.send("Something went wrong.");
            console.log(err);
          });
        break;
      }
      case "test": {
        console.log("command ==== ", command);
        // console.log(clientUser);
        break;
      }
      case "help": {
        return this._featureService.help(message, clientUser);
      }
      // case 'translate': {
      //   return utilCommands.translate(args, message, bot)
      // }
      default: {
        message.channel.send(
          "What do you mean by `>" +
            command +
            "`? How about taking a look at `>help`?."
        );
        break;
      }
    }
  }

  public get musicService(): MusicService {
    return this._musicService;
  }

  public get featureService(): FeatureService {
    return this._featureService;
  }

  public get admintrationService(): AdministrationService {
    return this._administrationService;
  }

  // public async sendMessage(
  //   message: Message,
  //   content: string
  // ): Promise<Message> {
  //   return (await message.channel.send(content)) as Message;
  // }
}
