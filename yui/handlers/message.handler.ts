import { MessageHandlerInitiator } from '@/decorators/handler.decorator'
import { Message, ClientUser } from 'discord.js'
import type { MusicService } from './services/music/music.service'
import type { FeatureService } from './services/feature/feature.service'
import type { AdministrationService } from './services/administration/administration.service'
import { debugLogger } from './error.handler'

@MessageHandlerInitiator()
export class MessageHandler {
  private _musicService: MusicService
  private _featureService: FeatureService
  private _administrationService: AdministrationService
  constructor() {
    debugLogger('MessageHandler')
  }

  public async execute(
    clientUser: ClientUser,
    message: Message,
    command: string,
    args?: Array<string>
  ) {
    switch (command) {
      case 'play':
      case 'p':
        return await this._musicService.play(message, args)

      case 'playnext':
      case 'pnext':
      case 'pn':
        return await this._musicService.addToNext(message, args)

      case 'skip':
      case 'next':
        return await this._musicService.skipSongs(message, args)

      case 'join':
      case 'come':
        return await this._musicService.joinVoiceChannel(message)

      case 'leave':
      case 'bye':
        return await this._musicService.leaveVoiceChannel(message)

      case 'np':
      case 'nowplaying':
        return await this.musicService.getNowPlayingData(message, clientUser)

      case 'queue':
      case 'q':
        return await this._musicService.printQueue(message, args)

      case 'pause':
        return await this._musicService.musicController(message, true)

      case 'resume':
        return await this._musicService.musicController(message, false)

      case 'stop':
        return await this._musicService.stopPlaying(message)

      case 'loop':
        return await this._musicService.loopSettings(message, args)

      case 'shuffle':
        return await this._musicService.shuffleQueue(message)

      case 'remove':
        return await this._musicService.removeSongs(message, args)

      case 'clear':
        return await this._musicService.clearQueue(message)

      case 'search':
        return await this._musicService.searchSong(message, args)

      case 'autoplay':
      case 'ap':
        return await this._musicService.autoPlay(message)

      //end of music command batch
      case 'ping': {
        return this._featureService.getPing(message, clientUser.client.pings)
      }
      case 'say': {
        return this._featureService.say(message, args)
      }
      case 'tenor': {
        return this._featureService.tenorGif(message, args)
      }
      case 'admin': {
        const deletedMessage = await message.delete()
        if (!deletedMessage)
          message.author.send(
            `Something went wrong, i couldn't delete the message`
          )
        return
      }
      case 'test': {
        console.log('command ==== ', command)
        // console.log(clientUser);
        break
      }
      case 'help': {
        return this._featureService.help(message, clientUser)
      }
      // case 'translate': {
      //   return utilCommands.translate(args, message, bot)
      // }
      default: {
        message.channel.send(
          'What do you mean by `>' +
            command +
            '`? How about taking a look at `>help`?.'
        )
        break
      }
    }
  }

  public get musicService(): MusicService {
    return this._musicService
  }

  public get featureService(): FeatureService {
    return this._featureService
  }

  public get admintrationService(): AdministrationService {
    return this._administrationService
  }
}
