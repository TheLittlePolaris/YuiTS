import { Client } from 'discord.js'
import { Injectable } from './decorators/injector'

@Injectable()
export class YuiClient extends Client {
  constructor() {
    super()
  }
}
