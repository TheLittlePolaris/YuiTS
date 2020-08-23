import { LOG_SCOPE } from '@/constants/constants'
import { VoiceStateInitiator } from '@/decorators/voice-state.decorator'
import { VoiceState } from 'discord.js'
import { debugLogger, errorLogger } from './log.handler'
import { MusicStream } from './services/music/music-entities/music-stream'
import { VoiceStateAction } from './services/music/music-interfaces/voice-state.interface'
import { MusicService } from './services/music/music.service'

@VoiceStateInitiator()
export class VoiceStateHandler {
  private currentMusicService: MusicService
  constructor(musicService: MusicService) {
    this.currentMusicService = musicService
    debugLogger(LOG_SCOPE.VOICE_STATE_HANDLER)
  }

  public checkOnVoiceStateUpdate(oldVoiceState: VoiceState, newVoiceState: VoiceState): void {
    try {
      if (!oldVoiceState && !newVoiceState) return

      const voiceStateCheck = this.checkOnLeave(oldVoiceState, newVoiceState)

      switch (voiceStateCheck?.action) {
        case 'clear': {
          if (voiceStateCheck?.stream?.leaveOnTimeOut) {
            clearTimeout(voiceStateCheck?.stream?.leaveOnTimeOut)
            voiceStateCheck.stream.set('leaveOnTimeout', null)
          }
          break
        }
        case 'leave': {
          const timeout = setTimeout(() => {
            this.leaveOnTimeout(voiceStateCheck?.stream)
          }, 30000)
          voiceStateCheck.stream.set('leaveOnTimeout', timeout)

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
    const stream = this.currentMusicService?.streams.get(oldState?.guild?.id)
    const boundVoiceChannel = stream?.boundVoiceChannel
    if (boundVoiceChannel) {
      const oldStateChannel = oldState?.channel
      const newStateChannel = newState?.channel
      if (newStateChannel === boundVoiceChannel) {
        return { stream, action: 'clear' }
      } else if (
        (!newStateChannel || newStateChannel !== boundVoiceChannel) &&
        oldStateChannel.members.size === 1 // just yui left
      ) {
        return { stream, action: 'leave' }
      }
    }
    return { stream, action: 'ignore' }
  }

  public leaveOnTimeout(stream: MusicStream): void {
    try {
      stream.boundVoiceChannel.leave()
      stream.boundTextChannel.send("**_There's no one around so I'll leave too. Bye~!_**")
      this.currentMusicService.resetStreamStatus(stream)
      this.currentMusicService.deleteStream(stream)
    } catch (err) {
      errorLogger(new Error(err))
    }
  }
}
