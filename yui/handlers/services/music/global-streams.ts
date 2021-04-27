import { MusicStream } from './music-entities/music-stream'

export abstract class GlobalMusicStream {
  static _streams = null

  static createStream() {
    this._streams = new Map<string, MusicStream>()
  }

  static get streams() {
    return this._streams
  }
}
GlobalMusicStream.createStream()
