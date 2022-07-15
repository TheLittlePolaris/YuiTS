/* eslint-disable @typescript-eslint/no-explicit-any */

import { Client } from 'discord.js'
import { DiscordEvent } from '../constants'

/* ================================== INTERFACES ===================================== */
export type GenericClassDecorator<T> = (target: T) => void

export type GenericMethodDecorator = (
  target: Prototype,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => void

export type Type<T> = Function & {
  new (...args: any[]): T
}

export interface Prototype {
  constructor: Function
}

export type Provider<T = any> = CustomValueProvider<T> &
  CustomClassProvider<T> &
  CustomFactoryProvider<T>

export interface CustomValueProvider<T> {
  provide: string
  useValue: T
}

export interface CustomClassProvider<T> {
  provide: string
  useClass: Type<T>
}

export interface CustomFactoryProvider<T> {
  provide: string
  useFactory: (..._injections: any[]) => T
}

export type CustomProviderToken = { [key: string]: number | string }

export interface ModuleOption {
  providers?: CustomValueProvider<any>[]
  modules?: Type<any>[]
  components?: Type<any>[]
  interceptors?: Type<any>[]
  entryComponent?: Type<any>
}

export interface EntryComponent {
  start: (token: string) => void | Promise<void>
  client: Client
}

export interface OnComponentInit {
  onComponentInit: () => any
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

export interface ICommandHandlerMetadata {
  propertyKey: string
  command: string
  commandAliases?: string[]
}

/**************************************************************************************/
