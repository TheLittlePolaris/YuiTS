import { ExecutionContext } from '../event-execution-context/execution-context'

export type IInterceptor<T> = {
  intercept(context: ExecutionContext, next: () => T): T
}
