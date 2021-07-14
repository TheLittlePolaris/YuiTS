import { Prototype, Type } from "@/dep-injection-ioc/interfaces/di-interfaces"
import { decoratorLogger } from "@/dep-injection-ioc/log/logger"
import { EVENT_HANDLER, HANDLE_PARAMS } from "../constants/di-connstants"

export function Handle(event: string) {
  return (target: Type<any>) => {
    decoratorLogger(target.constructor.name, 'Class')
    Reflect.defineMetadata(EVENT_HANDLER, { event }, target)
  }
}

export function HandleMessage(message: string)  {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(EVENT_HANDLER, target, propertyKey) || []
    definedParams = []
    Reflect.defineMetadata(EVENT_HANDLER, definedParams, target, propertyKey)
  }
}

export const Author = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(HANDLE_PARAMS.AUTHOR, paramIndex, target, propertyKey)
  }
}

export const Message = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(HANDLE_PARAMS.MESSAGE, paramIndex, target, propertyKey)
  }
}


export const Args = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(HANDLE_PARAMS.ARGS, paramIndex, target, propertyKey)
  }
}



