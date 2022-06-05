import { CUSTOM_INTERCEPTOR, DiscordEvent, INTERCEPTOR_TARGET } from '../constants'
import { GenericClassDecorator, Type } from '../interfaces'

export function Interceptor(forEvent: DiscordEvent): GenericClassDecorator<Type<any>> {
  return (target: Type<any>) => {
    Reflect.defineMetadata(CUSTOM_INTERCEPTOR, forEvent, target)
  }
}

export function UseInterceptor(interceptorFn?: Type<any>): GenericClassDecorator<Type<any>> {
  return (target: Type<any>) => {
    if (interceptorFn?.name) {
      const isCorrect = Reflect.getMetadata(CUSTOM_INTERCEPTOR, interceptorFn)
      if (!isCorrect) throw new Error('No such interceptor')
    }
    Reflect.defineMetadata(INTERCEPTOR_TARGET, interceptorFn.name, target)
  }
}
