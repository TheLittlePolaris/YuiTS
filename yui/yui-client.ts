import { Client } from 'discord.js'
import { Injectable } from './dep-injection-ioc/decorators'

@Injectable()
export class YuiClient extends Client {}
