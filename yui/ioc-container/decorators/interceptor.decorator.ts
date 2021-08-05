import { DiscordEvent } from '@/constants/discord-events'
import { APP_INTERCEPTOR, INTERCEPTOR_TARGET } from '../constants/di-connstants'
import { GenericClassDecorator, Type } from '../interfaces/di-interfaces'

export function Interceptor(forEvent: DiscordEvent): GenericClassDecorator<Type<any>> {
  return (target: Type<any>) => {
    Reflect.defineMetadata(APP_INTERCEPTOR, forEvent, target)
  }
}

export function UseInterceptor(interceptorFn?: Type<any>): GenericClassDecorator<Type<any>> {
  return (target: Type<any>) => {
    if (interceptorFn?.name) {
      const isCorrect = Reflect.getMetadata(APP_INTERCEPTOR, interceptorFn)
      if (!isCorrect) throw new Error('No such interceptor')
    }
    Reflect.defineMetadata(INTERCEPTOR_TARGET, interceptorFn.name, target)
  }
}
