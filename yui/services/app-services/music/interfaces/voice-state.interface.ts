import { MusicStream } from '../entities/music-stream'

export interface VoiceStateAction {
  stream: MusicStream
  action: 'ignore' | 'clearTimeout' | 'setLeaveTimeout'
}
