import { DiscordEvent } from '@/ioc-container/constants/discord-events'
import { ClientEvents } from 'discord.js'
import { Observable } from 'rxjs'

export interface IBaseInterceptor {
  intercept(args: ClientEvents[DiscordEvent], next: () => any): void
}

export interface IRxjsInterceptor {
  intercept<T = any>(args: ClientEvents[DiscordEvent], next: () => Observable<T>): Observable<T>
}
