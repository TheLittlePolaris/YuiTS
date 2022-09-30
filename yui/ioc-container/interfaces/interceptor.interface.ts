import { ExecutionContext } from '../event-execution-context';

export interface IInterceptor<T> {
  intercept(context: ExecutionContext, next: () => T): T;
}
