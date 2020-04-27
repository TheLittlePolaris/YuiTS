import type { VoiceConnection } from 'discord.js'

export interface IVoiceConnection extends VoiceConnection {
  player: {
    streamingData: {
      pausedTime: number
    }
    destroy(): void
  }
}
