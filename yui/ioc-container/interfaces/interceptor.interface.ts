import { ExecutionContext } from '../event-execution-context/event-execution-context'

export type IInterceptor<T> = {
  intercept(context: ExecutionContext, next: () => T): T
}
