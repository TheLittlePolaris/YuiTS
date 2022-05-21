import { DiscordEvent } from '@/ioc-container/constants/discord-events'
import { ClientEvents } from 'discord.js'
import { Observable } from 'rxjs'
import { ExecutionContext } from '../event-execution-context/event-execution-context'

export interface IBaseInterceptor {
  intercept(args: ClientEvents[DiscordEvent], next: () => any): void
}

export interface IRxjsInterceptor {
  intercept<T = any>(context: ExecutionContext, next: () => Observable<T>): Observable<T>
}
