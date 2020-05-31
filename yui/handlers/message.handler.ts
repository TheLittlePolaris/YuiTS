import { LOG_SCOPE } from '@/constants/constants'
import { MessageHandlerInitiator } from '@/decorators/handler.decorator'
import { Client, Message } from 'discord.js'
import { debugLogger, errorLogger } from './log.handler'
import { OwnerChannelService } from './owner-service/channel.service'
import { AdministrationService } from './services/administration/administration.service'
import { FeatureService } from './services/feature/feature.service'
import { MusicService } from './services/music/music.service'

@MessageHandlerInitiator()
export class MessageHandler {
  private _musicService: MusicService
  private _featureService: FeatureService
  private _administrationService: AdministrationService
  private _ownerChannelService: OwnerChannelService
  constructor() {
    debugLogger(LOG_SCOPE.MESSAGE_HANDLER)
  }

  public async execute(
    message: Message,
    command: string,
    args?: Array<string>
  ) {
    switch (command) {
      case 'play':
      case 'p':
        return await this._musicService.play(message, args, false)

      case 'playnext':
      case 'pnext':
      case 'pn':
        return await this._musicService.play(message, args, true)

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
        return await this.musicService.getNowPlayingData(message)

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

      case 'volume':
        return await this._musicService.setVolume(message, args)

      //end of music command batch
      case 'ping': {
        return this._featureService.getPing(message)
      }
      case 'say': {
        await message.delete().catch((error) => {
          message.author.send(
            `Something went wrong, i couldn't delete the message`
          )
          this.handleError(new Error(error))
        })
        return this._featureService.say(message, args)
      }
      case 'holostat': {
        return this._featureService.getHoloStat(message, args)
      }
      case 'tenor': {
        try {
          await message.delete()
        } catch (err) {
          message.author.send(`Sorry i couldn't delete the message`)
        }
        return this._featureService.tenorGif(message, args)
      }
      case 'admin': {
        const deletedMessage = await message.delete().catch((error) => {
          message.author.send(
            `Something went wrong, i couldn't delete the message`
          )
          this.handleError(new Error(error))
        })
        if (!deletedMessage) {
          return
        }
        return await this._administrationService.executeCommand(message, args)
      }
      case 'test': {
        this.musicService.soundcloudGetSongInfo(message, args[0])
        // this.musicService.scPlaySong(message, args[0])
        break
      }
      case 'help': {
        return this._featureService.help(message)
      }
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

  async specialExecute(message: Message, yui: Client) {
    const content = message.content.trim().split(/ +/g)
    const command = content.shift().toLowerCase()

    switch (command) {
      case 'statistics':
      case 'stat':
        return this._ownerChannelService.statistics(message, content, yui)
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

  handleError(error: Error | string) {
    return errorLogger(error, LOG_SCOPE.MESSAGE_HANDLER)
  }
}
