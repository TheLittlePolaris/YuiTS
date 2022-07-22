import {
  HandleVoiceState,
  NewStateChannel,
  OldStateChannel,
  OnEvent,
  UseInterceptor
} from 'djs-ioc-container'
import { VoiceChannel } from 'discord.js'
import { VoiceStateInterceptor } from './voicestate.interceptor'
import { getStream } from '@/services/music/entities'
import { MusicService } from '@/services/music/music.service'

@OnEvent('voiceStateUpdate')
@UseInterceptor(VoiceStateInterceptor)
export class VoiceStateEventHandler {
  constructor(private musicService: MusicService) {}

  @HandleVoiceState()
  public onVoiceStateUpdate(
    @OldStateChannel() oldChannel: VoiceChannel,
    @NewStateChannel() newChannel: VoiceChannel
  ) {
    const stream = getStream(oldChannel?.guild.id || newChannel?.guild.id)

    const boundVoiceChannel = stream?.voiceChannel
    if (!boundVoiceChannel) return
    if (newChannel?.id === boundVoiceChannel.id && stream.leaveOnTimeout) {
      clearTimeout(stream.leaveOnTimeout)
      stream.set('leaveOnTimeout', null)
    } else if (newChannel?.id !== boundVoiceChannel.id && oldChannel?.members?.size === 1) {
      const timeout = setTimeout(() => this.musicService.timeoutLeaveChannel(stream), 30000)
      stream.set('leaveOnTimeout', timeout)
    }
  }
}
