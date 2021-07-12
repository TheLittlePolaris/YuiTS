import { Injectable } from '@/dep-injection-ioc/decorators'
import { Collection } from 'discord.js'
import { MusicStream } from './music-entities/music-stream'

@Injectable()
export class GlobalMusicStream extends Collection<string, MusicStream> {
  constructor() {
    super()
  }
}
