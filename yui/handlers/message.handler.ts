import { Message } from "discord.js";
import { MusicService } from "../services/music.service";
import { AccessControlerHandler } from "./access-controller.handler";

export class MessageHandler {
  private _musicService: MusicService;
  private _accessController: AccessControlerHandler;
  constructor() {
    this._musicService = new MusicService();
    this._accessController = new AccessControlerHandler(this._musicService);
  }

  public async execute(
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
        //   if (musicCommands.guard(message, true)) {
        //     return message.channel.send(" :loudspeaker: Kawaii **Yui-chan** is here~! xD");
        //   }
        break;
      }
      case "leave":
      case "bye": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     message.member.voiceChannel.leave();
        //     musicCommands.resetStatus(message.guild.id);
        //     musicCommands.resetChannelStat(message.guild.id)
        //     return message.channel.send("**_Bye bye~! Matta nee~!_**");
        //   }
        break;
      }
      case "np":
      case "nowplaying": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.nowPlaying(message, bot);
        //   }
        break;
      }
      case "queue":
      case "q": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.check_queue(message, args);
        //   }
        break;
      }
      case "pause": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.pause(message);
        //   }
        break;
      }
      case "resume": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.resume(message);
        //   }
        break;
      }
      case "stop": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.stop(message);
        //   }
        break;
      }
      case "loop": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.loopSetting(message, args);
        //   }
        break;
      }
      case "shuffle": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     musicCommands.shuffleQ(message);
        //   }
        break;
      }
      case "remove": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.remove_songs(message, args);
        //   }
        break;
      }
      case "clear": {
        const guard = await this._accessController.voiceAccessController(
          message,
          false
        );
        //   if (musicCommands.guard(message, false)) {
        //     return musicCommands.clearQueue(message);
        //   }
        break;
      }
      case "search": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        //   if (musicCommands.guard(message, true)) {
        //     var query = args.join(" ");
        //     return musicCommands.searchSong(query, message);
        //   }
        break;
      }
      case "autoplay":
      case "ap": {
        const guard = await this._accessController.voiceAccessController(
          message,
          true
        );
        //   if (musicCommands.guard(message, true)) {
        //     musicCommands.autoPlay(message);
        //   }
        break;
      }
      //end of music command batch
      case "ping": {
        // return utilCommands.getPing(message, bot);
      }
      case "say": {
        // return utilCommands.say(args, message);
      }
      // case 'translate': {
      //   return utilCommands.translate(args, message, bot)
      // }
      case "ten": {
        // return utilCommands.tenorGIF(args, message);
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
      case "help": {
        // return utilCommands.help(message, bot);
      }
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

  public async sendMessage(
    message: Message,
    content: string
  ): Promise<Message> {
    return (await message.channel.send(content)) as Message;
  }
}
