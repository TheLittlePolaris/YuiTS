import { Interceptor, IInterceptor, ExecutionContext } from 'djs-ioc-container'
import { Observable } from 'rxjs'

@Interceptor('voiceStateUpdate')
export class VoiceStateInterceptor implements IInterceptor<Observable<any>> {
  intercept(ctx: ExecutionContext, next: () => Observable<any>): Observable<any> {
    return next()
  }
}
