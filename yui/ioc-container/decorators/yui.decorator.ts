import { DiscordEvent } from '@/constants/discord-events'
import {
  INJECTABLE_METADATA,
  DESIGN_TYPE,
  COMPONENT_METADATA,
  paramKeyConstructor,
} from '@/ioc-container/constants/di-connstants'
import {
  Type,
  GenericClassDecorator,
  EventParamMetadata,
  Prototype,
} from '../interfaces/di-interfaces'
import { isFunction } from '@/ioc-container/helper-functions'
import { decoratorLogger } from '@/ioc-container/log/logger'

export function Yui<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<T>) => {
    decoratorLogger(target.name, 'Class')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

// https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
export const On = (event: DiscordEvent): MethodDecorator => {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    const propertyDesignType = Reflect.getMetadata(DESIGN_TYPE, target, propertyKey)
    if (!isFunction(propertyDesignType)) throw new Error(`Client's event property has to be a method!`)
    decoratorLogger(target.constructor.name, `On - ${event}`, propertyKey)
    let eventList: { [key: string]: string } = Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, target) || []
    eventList = { ...eventList, [event]: propertyKey }
    Reflect.defineMetadata(COMPONENT_METADATA.EVENT_LIST, eventList, target.constructor)
  }
}

/* param's metadata, may need in the future */
export const EventMessage = (): ParameterDecorator => {
  return (target: Prototype, propertyKey: string, index: number) => {
    const metadataKey = paramKeyConstructor('message', propertyKey)
    let paramList = Reflect.getMetadata(metadataKey, target) || []
    const paramMetadata: EventParamMetadata = { event: 'message', propertyKey, index }
    paramList = [paramMetadata, ...paramList]
    Reflect.defineMetadata(metadataKey, paramList, target)
  }
}

export const EventVoiceState = (additionalParam: 'old' | 'new'): ParameterDecorator => {
  return (target: Prototype, propertyKey: string, index: number) => {
    const metadataKey = paramKeyConstructor('voiceStateUpdate', propertyKey)
    let paramList = Reflect.getMetadata(metadataKey, target) || []
    const paramMetadata: EventParamMetadata = { event: 'voiceStateUpdate', propertyKey, index, additionalParam }
    paramList = [paramMetadata, ...paramList]
    Reflect.defineMetadata(metadataKey, paramList, target)
  }
}
