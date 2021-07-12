/* eslint-disable @typescript-eslint/no-explicit-any */

import { DiscordEvent } from '@/constants/discord-events'
import { Client } from 'discord.js'

/* ================================== INTERFACES ===================================== */
export type GenericClassDecorator<T> = (target: T) => void

export type GenericMethodDecorator<T> = (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => void

export interface Type<T> extends Function {
  new (...args: any[]): T
}

export interface Prototype {
  constructor: Function
}

export type Provider<T = any> = CustomValueProvider<T> | CustomClassProvider<T>

export interface CustomValueProvider<T> {
  provide: string
  useValue: T
}

export interface CustomClassProvider<T> {
  provide: string
  useClass: Type<T>
}

export type CustomProviderToken = { [key: string]: number | string }

export interface ModuleOption {
  providers?: CustomValueProvider<any>[]
  modules?: Type<any>[]
  components?: Type<any>[]
  entryComponent?: Type<any>
}

export interface EntryComponent {
  start: (...args: any) => void | Promise<void>
  client: Client
}

export interface IEvent {
  eventName: DiscordEvent
  propertyKey: string
  value: Function
}

export interface EventParamMetadata {
  event?: string
  index: number
  propertyKey: string | symbol
  additionalParam?: string
}
/**************************************************************************************/
