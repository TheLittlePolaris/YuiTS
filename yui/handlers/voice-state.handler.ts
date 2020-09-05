import { LOG_SCOPE } from '@/constants/constants'
import { VoiceStateInitiator } from '@/decorators/voice-state.decorator'
import { VoiceState } from 'discord.js'
import { debugLogger, errorLogger } from './log.handler'
import { MusicStream } from './services/music/music-entities/music-stream'
import { VoiceStateAction } from './services/music/music-interfaces/voice-state.interface'
import { MusicService } from './services/music/music.service'

@VoiceStateInitiator()
export class VoiceStateHandler {
  constructor(private musicService: MusicService) {
    debugLogger(LOG_SCOPE.VOICE_STATE_HANDLER)
  }
  public checkOnVoiceStateUpdate(oldVoiceState: VoiceState, newVoiceState: VoiceState): void {
    try {
      if (!oldVoiceState && !newVoiceState) return
      const { action, stream } = this.checkOnLeave(oldVoiceState, newVoiceState)
      switch (action) {
        case 'clearTimeout': {
          if (stream.leaveOnTimeOut) {
            clearTimeout(stream.leaveOnTimeOut)
            stream.set('leaveOnTimeout', null)
          }
          break
        }
        case 'setLeaveTimeout': {
          const timeout = setTimeout(() => {
            this.leaveOnTimeout(stream)
          }, 30000)
          stream.set('leaveOnTimeout', timeout)
          break
        }
        default:
        case 'ignore': {
          break
        }
      }
    } catch (err) {
      errorLogger(new Error(err))
    }
  }

  public checkOnLeave(oldState: VoiceState, newState: VoiceState): VoiceStateAction {
    const stream = this.musicService.streams.get(oldState.guild.id)
    const boundVoiceChannel = stream && stream.boundVoiceChannel
    if (!boundVoiceChannel) return { stream, action: 'ignore' }
    const [oldStateChannel, newStateChannel] = [oldState.channel, newState.channel]
    if (newStateChannel === boundVoiceChannel) {
      return { stream, action: 'clearTimeout' }
    } else if ((!newStateChannel || newStateChannel !== boundVoiceChannel) && oldStateChannel.members.size === 1) {
      return { stream, action: 'setLeaveTimeout' }
    }
    return { stream, action: 'ignore' }
  }

  public leaveOnTimeout(stream: MusicStream): void {
    try {
      stream.boundVoiceChannel.leave()
      stream.boundTextChannel.send("**_There's no one around so I'll leave too. Bye~!_**")
      this.musicService.resetStreamStatus(stream)
      this.musicService.deleteStream(stream)
    } catch (err) {
      errorLogger(new Error(err))
    }
  }
}
