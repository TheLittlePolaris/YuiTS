import type { GuildMember, VoiceState } from 'discord.js'
import type { MusicService } from './services/music/music.service'
import type { VoiceStateAction } from './services/music/music-entities/interfaces/voice-state.interface'
import type { MusicStream } from './services/music/music-entities/music-stream'
import { debugLogger } from './log.handler'
import { LOG_SCOPE } from '@/constants/constants'

export class VoiceStateHandler {
  private currentMusicService: MusicService
  constructor(musicService: MusicService) {
    this.currentMusicService = musicService
    debugLogger(LOG_SCOPE.VOICE_STATE_HANDLER)
  }

  public checkOnVoiceStateUpdate(
    oldVoiceState: VoiceState,
    newVoiceState: VoiceState
  ) {
    // if (!oldVoiceState && !newVoiceState) return
    // let voiceStateCheck = this.checkOnLeave(oldVoiceState, newVoiceState)
    // switch (voiceStateCheck.action) {
    //   case 'clear': {
    //     if (voiceStateCheck.stream && voiceStateCheck.stream.leaveOnTimeOut) {
    //       clearTimeout(voiceStateCheck.stream.leaveOnTimeOut)
    //       voiceStateCheck.stream.set('leaveOnTimeout', null)
    //     }
    //     break
    //   }
    //   case 'leave': {
    //     if (oldVoiceState.voiceChannel.members.size === 1) {
    //       const timeout = setTimeout(() => {
    //         this.leaveOnTimeout(voiceStateCheck.stream)
    //       }, 30000)
    //       voiceStateCheck.stream.set('leaveOnTimeout', timeout)
    //     }
    //     break
    //   }
    //   default:
    //   case 'ignore': {
    //     break
    //   }
    // }
  }

  // public checkOnLeave(
  //   oldMember: GuildMember,
  //   newMember: GuildMember
  // ): VoiceStateAction {
  //   let stream = this.currentMusicService.streams.get(oldMember.guild.id)
  //   let boundVoiceChannel = stream ? stream.boundVoiceChannel : undefined
  //   if (boundVoiceChannel) {
  //     let oldMemberStatus = oldMember.voiceChannel
  //     let newMemberStatus = newMember.voiceChannel
  //     if (newMemberStatus === boundVoiceChannel) {
  //       const action: VoiceStateAction = { stream, action: 'clear' }
  //       return action
  //     } else if (!oldMemberStatus || oldMemberStatus !== boundVoiceChannel) {
  //       const action: VoiceStateAction = { stream, action: 'ignore' }
  //       return action
  //     } else if (!newMemberStatus || newMemberStatus !== boundVoiceChannel) {
  //       const action: VoiceStateAction = { stream, action: 'leave' }
  //       return action
  //     }
  //   } else {
  //     const action: VoiceStateAction = { stream, action: 'ignore' }
  //     return action
  //   }
  // }

  public leaveOnTimeout(stream: MusicStream) {
    stream.boundVoiceChannel.leave()
    stream.boundTextChannel.send(
      "**_There's no one around so I'll leave too. Bye~!_**"
    )
    this.currentMusicService.resetStreamStatus(stream)
    this.currentMusicService.deleteStream(stream)
  }
}
