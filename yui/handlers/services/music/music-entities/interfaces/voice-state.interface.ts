import { MusicStream } from "../music-stream";

export interface VoiceStateAction {
  stream: MusicStream;
  action: string;
}
