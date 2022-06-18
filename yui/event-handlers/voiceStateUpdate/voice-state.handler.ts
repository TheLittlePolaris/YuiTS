import { HandleVoiceState, OnEvent, State, UseInterceptor, VoiceStateKey } from '@/ioc-container'
import { VoiceChannel } from 'discord.js'
import { MusicService } from '../../services/app-services/music/music.service'
import { VoiceStateInterceptor } from './voicestate.interceptor'

@OnEvent('voiceStateUpdate')
@UseInterceptor(VoiceStateInterceptor)
export class VoiceStateEventHandler {
  constructor(private musicService: MusicService) {}

  @HandleVoiceState()
  public onVoiceStateUpdate(
    @State(VoiceStateKey.OldStateChannel) oldChannel: VoiceChannel,
    @State(VoiceStateKey.NewStateChannel) newChannel: VoiceChannel
  ) {    
    const stream = this.musicService.streams.get(oldChannel?.guild.id || newChannel?.guild.id)
    const boundVC = stream?.boundVoiceChannel
    if (!boundVC) return

    if (newChannel?.id === boundVC.id && stream.leaveOnTimeout) {
      clearTimeout(stream.leaveOnTimeout)
      stream.set('leaveOnTimeout', null)
    } else if ((!newChannel || newChannel.id !== boundVC.id) && oldChannel?.members?.size === 1) {
      const timeout = setTimeout(() => this.musicService.timeoutLeaveChannel(stream), 30000)
      stream.set('leaveOnTimeout', timeout)
    }
  }
}
