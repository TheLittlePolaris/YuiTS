import { HandleVoiceState, OnEvent, StateChannel } from '@/ioc-container'
import { VoiceChannel } from 'discord.js'
import { MusicService } from '../services/app-services/music/music.service'

@OnEvent('voiceStateUpdate')
export class VoiceStateEventHandler {
  constructor(private musicService: MusicService) {}

  @HandleVoiceState()
  public onVoiceStateUpdate(
    @StateChannel('old') oldChannel: VoiceChannel,
    @StateChannel('new') newChannel: VoiceChannel
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
