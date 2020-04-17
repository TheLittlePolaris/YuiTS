import type { AudioPlayer, VoiceConnection } from 'discord.js';

export interface IAudioPlayer extends AudioPlayer {
  streamingData: {
    pausedTime: number;
  };
  destroy(): void;
}
export interface IVoiceConnection extends VoiceConnection {
  player: IAudioPlayer;
}
