import { MusicStream } from '../music-entities/music-stream'

export interface VoiceStateAction {
  stream: MusicStream
  action: string
}
