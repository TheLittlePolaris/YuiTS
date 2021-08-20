import { VoiceChannel } from 'discord.js'
import { MusicService } from '../services/app-services/music/music.service'
import { OnEvent } from '@/ioc-container/decorators'
import {
  HandleVoiceState,
  StateChannel,
} from '@/ioc-container/decorators/event-handlers/voicestate-handle.decorator'
import { YuiLogger } from '@/services/logger/logger.service'

@OnEvent('voiceStateUpdate')
export class VoiceStateHandler {
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
    } else if ((!newChannel || newChannel.id !== boundVC.id) && oldChannel?.members.size === 1) {
      const timeout = setTimeout(() => this.musicService.timeoutLeaveChannel(stream), 30000)
      stream.set('leaveOnTimeout', timeout)
    }
  }
}
