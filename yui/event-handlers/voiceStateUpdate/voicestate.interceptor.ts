import { Interceptor, IInterceptor, ExecutionContext, Logger } from '@/ioc-container'
import { Observable, tap } from 'rxjs'

@Interceptor('voiceStateUpdate')
export class VoiceStateInterceptor implements IInterceptor<Observable<any>> {
  intercept(ctx: ExecutionContext, next: () => Observable<any>): Observable<any> {
    return
    // return next().pipe(
    //   tap(() => {
    //     Logger.log('Voice state changed.')
    //   })
    // )
  }
}
