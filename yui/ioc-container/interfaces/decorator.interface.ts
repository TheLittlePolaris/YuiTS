import { ExecutionContext } from '../event-execution-context/event-execution-context'

export type MethodDecoratorResolver = (context: ExecutionContext) => ExecutionContext | Promise<ExecutionContext>

export type ParamDecoratorResolver<T = any> = (context: ExecutionContext) => T
