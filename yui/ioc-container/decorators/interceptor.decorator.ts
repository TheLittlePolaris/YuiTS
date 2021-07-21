import { DiscordEvent } from '@/constants/discord-events'
import { APP_INTERCEPTOR, INTERCEPTOR_TARGET } from '../constants/di-connstants'
import { GenericClassDecorator, Type } from '../interfaces/di-interfaces'
import { decoratorLogger } from '../log/logger'

export function Interceptor<T = any>(forEvent: DiscordEvent): GenericClassDecorator<Type<T>> {
  return (target: Type<any>) => {
    // decoratorLogger(target.name, 'Class')
    Reflect.defineMetadata(APP_INTERCEPTOR, forEvent, target)
  }
}

export function UseInterceptor<T>(interceptorFn?: Type<T>) {
  return (target: Type<any>) => {
    // decoratorLogger(target.name, 'Class')
    if (interceptorFn?.name) {
      const isCorrect = Reflect.getMetadata(APP_INTERCEPTOR, interceptorFn)
      if (!isCorrect) throw new Error('No such interceptor')
    }
    Reflect.defineMetadata(INTERCEPTOR_TARGET, interceptorFn.name, target)
  }
}
