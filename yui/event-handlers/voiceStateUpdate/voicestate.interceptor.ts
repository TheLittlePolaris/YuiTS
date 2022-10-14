import { Interceptor, IInterceptor, ExecutionContext } from '@tlp01/djs-ioc-container';
import { Observable } from 'rxjs';

@Interceptor('voiceStateUpdate')
export class VoiceStateInterceptor implements IInterceptor<Observable<any>> {
  intercept(context: ExecutionContext, next: () => Observable<any>): Observable<any> {
    return next();
  }
}
