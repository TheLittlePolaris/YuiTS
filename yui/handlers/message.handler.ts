import { LOG_SCOPE } from '@/constants/constants'

import { GuildMember, Message } from 'discord.js'
import { OwnerChannelService } from '../services/owner-service/channel.service'
import { AdministrationService } from '../services/app-services/administration/administration.service'
import { FeatureService } from '../services/app-services/feature/feature.service'
import { MusicService } from '../services/app-services/music/music.service'
import { YuiLogger } from '@/log/logger.service'
import {
  Args,
  Author,
  Handle,
  HandleMessage,
  MessageParam,
} from '@/ioc-container/decorators/handle.decorator'


@Handle('message')
export class MessageHandler {
  constructor(
    private musicService: MusicService,
    private featureService: FeatureService,
    private administrationService: AdministrationService,
    private ownerChannelService: OwnerChannelService
  ) {
    YuiLogger.info(`Created!`, LOG_SCOPE.MESSAGE_HANDLER)
  }

  public async messageSwitchMap(
    message: Message,
    command: string,
    args?: Array<string>
  ): Promise<unknown> {
    switch (command) {
      case 'play':
      case 'p':
        return this.musicService.play(message, args, false)

      case 'playnext':
      case 'pnext':
      case 'pn':
        return this.musicService.play(message, args, true)

      case 'skip':
      case 'next':
        return this.musicService.skipSongs(message, args)

      case 'join':
      case 'come':
        return this.musicService.joinVoiceChannel(message)

      case 'leave':
      case 'bye':
        return this.musicService.leaveVoiceChannel(message)

      case 'np':
      case 'nowplaying':
        return this.musicService.getNowPlayingData(message)

      case 'queue':
      case 'q':
        return this.musicService.printQueue(message, args)

      case 'pause':
        return this.musicService.musicController(message, true)

      case 'resume':
        return this.musicService.musicController(message, false)

      case 'stop':
        return this.musicService.stopPlaying(message)

      case 'loop':
        return this.musicService.loopSettings(message, args)

      case 'shuffle':
        return this.musicService.shuffleQueue(message)

      case 'remove':
        return this.musicService.removeSongs(message, args)

      case 'clear':
        return this.musicService.clearQueue(message)

      case 'search':
        return this.musicService.searchSong(message, args)

      case 'autoplay':
      case 'ap':
        return this.musicService.autoPlay(message)

      case 'volume':
        return this.musicService.setVolume(message, args)

      //end of music command batch
      case 'ping': {
        return this.featureService.getPing(message)
      }
      case 'say': {
        message.delete().catch((error) => {
          message.author.send(`Something went wrong, i couldn't delete the message`)
          this.handleError(new Error(error))
        })
        return this.featureService.say(message, args)
      }
      case 'holostat': {
        return this.featureService.getHoloStat(message, args)
      }
      case 'tenor': {
        try {
          message.delete()
        } catch (err) {
          message.author.send(`Sorry i couldn't delete the message`)
        }
        return this.featureService.tenorGif(message, args)
      }
      case 'admin': {
        const deletedMessage = await message.delete().catch((error) => {
          message.author.send(`Something went wrong, i couldn't delete the message`)
          this.handleError(new Error(error))
        })
        if (!deletedMessage) {
          return
        }
        return this.administrationService.executeCommand(message, args)
      }
      case 'help': {
        return this.featureService.help(message)
      }
      default: {
        message.channel.send(
          'What do you mean by `>' + command + '`? How about taking a look at `>help`?.'
        )
        break
      }
    }
  }

  async specialExecute(message: Message): Promise<void> {
    const content = message.content.trim().split(/ +/g)
    const command = content.shift().toLowerCase()

    switch (command) {
      case 'statistics':
      case 'stat':
        return this.ownerChannelService.statistics(message, content)
    }
  }

  @HandleMessage('test')
  public async handleTest(
    @MessageParam() message: Message,
    @Author() author: GuildMember,
    @Args() args: string[]
  ) {
    console.log(message, `<======= message [message.handler.ts - 167]`);
    console.log(author, `<======= author [message.handler.ts - 168]`);
    console.log(args, `<======= args [message.handler.ts - 169]`);
  }

  @HandleMessage('test2')
  public async handleTest2(
    @MessageParam() message: Message,
    @Author() author: GuildMember,
    @Args() args: string[]
  ) {
    console.log(message, `<======= message [message.handler.ts - 167]`);
    console.log(author, `<======= author [message.handler.ts - 168]`);
    console.log(args, `<======= args [message.handler.ts - 169]`);
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.MESSAGE_HANDLER)
    return null
  }
}
