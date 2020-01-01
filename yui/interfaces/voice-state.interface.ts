import { MusicStream } from "../services/music-entities/music-stream";

export interface VoiceStateAction {
  stream: MusicStream;
  action: string;
}
