import { Message } from "discord.js";
import { MusicService } from "../services/music.service";

export class MessageHandler {
  private _musicService: MusicService;
  constructor() {
    this._musicService = new MusicService();
  }

  public execute(message: Message, command: string, args?: Array<string>) {
    switch (command) {
      case "play":
      case "p": {
        message.channel.send("playyyyyy");
        return this._musicService.play(message, args);
        //   if (musicCommands.checkChannel(message, true)) {
        //     return musicCommands.play(message, args);
        //   }
        break;
      }
      case "playnext":
      case "pnext":
      case "pn": {
        //   if (musicCommands.checkChannel(message, true)) {
        //     return musicCommands.addNext(message, args);
        //   }
        break;
      }
      case "skip":
      case "next": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.skip_songs(message, args);
        //   }
        break;
      }
      case "join":
      case "come": {
        //   if (musicCommands.checkChannel(message, true)) {
        //     return message.channel.send(" :loudspeaker: Kawaii **Yui-chan** is here~! xD");
        //   }
        break;
      }
      case "leave":
      case "bye": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     message.member.voiceChannel.leave();
        //     musicCommands.resetStatus(message.guild.id);
        //     musicCommands.resetChannelStat(message.guild.id)
        //     return message.channel.send("**_Bye bye~! Matta nee~!_**");
        //   }
        break;
      }
      case "np":
      case "nowplaying": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.nowPlaying(message, bot);
        //   }
        break;
      }
      case "queue":
      case "q": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.check_queue(message, args);
        //   }
        break;
      }
      case "pause": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.pause(message);
        //   }
        break;
      }
      case "resume": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.resume(message);
        //   }
        break;
      }
      case "stop": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.stop(message);
        //   }
        break;
      }
      case "loop": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.loopSetting(message, args);
        //   }
        break;
      }
      case "shuffle": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     musicCommands.shuffleQ(message);
        //   }
        break;
      }
      case "remove": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.remove_songs(message, args);
        //   }
        break;
      }
      case "clear": {
        //   if (musicCommands.checkChannel(message, false)) {
        //     return musicCommands.clearQueue(message);
        //   }
        break;
      }
      case "search": {
        //   if (musicCommands.checkChannel(message, true)) {
        //     var query = args.join(" ");
        //     return musicCommands.searchSong(query, message);
        //   }
        break;
      }
      case "autoplay":
      case "ap": {
        //   if (musicCommands.checkChannel(message, true)) {
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
}
