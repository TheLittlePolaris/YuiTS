import { Interceptor, IRxjsInterceptor } from '@/ioc-container'
import { ClientEvents } from 'discord.js'
import { Observable, tap } from 'rxjs'

@Interceptor('voiceStateUpdate')
export class VoiceStateInterceptor implements IRxjsInterceptor {
  intercept([oldState, newState]: ClientEvents['voiceStateUpdate'], next: () => Observable<any>): Observable<any> {
    return next().pipe(
      tap(() => {
        console.log('voice state changed')
      })
    )
  }
}
