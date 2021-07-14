import { Injectable } from '@/dep-injection-ioc/decorators';
import { Client } from 'discord.js'

@Injectable()
export class YuiClient extends Client {}
