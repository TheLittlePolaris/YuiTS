import { Observable } from 'rxjs'

import { ExecutionContext } from '../event-execution-context/event-execution-context'

export interface IPromiseInterceptor {
  intercept(context: ExecutionContext, next: () => Promise<any>): void
}

export interface IRxjsInterceptor {
  intercept<T = any>(context: ExecutionContext, next: () => Observable<T>): Observable<T>
}

export type IBaseInterceptor = IRxjsInterceptor | IPromiseInterceptor
