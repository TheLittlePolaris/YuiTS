import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { Collection } from 'discord.js'
import { MusicStream } from '../../services/app-services/music/music-entities/music-stream'

@Injectable()
export class GlobalMusicStream extends Collection<string, MusicStream> {
  constructor() {
    super()
  }
}
