import { VoiceConnection } from "@discordjs/voice";


export interface IVoiceConnection extends VoiceConnection {
  player: {
    streamingData: {
      pausedTime: number
    }
    destroy(): void
  }
}
