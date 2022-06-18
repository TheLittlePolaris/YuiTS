import { ExecutionContext } from '../event-execution-context/execution-context'
import { Prototype } from './dependencies-injection.interfaces'

export type MethodDecoratorResolver = (context: ExecutionContext) => ExecutionContext | Promise<ExecutionContext>
export type MethodDecoratorPresetter = (
  target: Prototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<Function>
) => void

export type ParamDecoratorResolver<T = any> = (context: ExecutionContext) => T | Promise<T>
