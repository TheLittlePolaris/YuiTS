import { Prototype, Type } from '@/ioc-container/interfaces/di-interfaces'
import { decoratorLogger } from '@/ioc-container/log/logger'
import { ClientEvents } from 'discord.js'
import { EVENT_HANDLER, HANDLE_PARAMS, COMMAND_HANDLER, COMMAND_HANDLER_PARAMS, DEFAULT_PARAM_INDEX } from '../constants/di-connstants'
import { ICommandHandlerMetadata } from '../interfaces/di-command-handler.interface'

export function Handle(event: keyof ClientEvents) {
  return (target: Type<any>) => {
    decoratorLogger(target.constructor.name, 'Class')
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
  }
}

export function HandleMessage(command = 'default', ...aliases: string[]) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command, commandAliases: aliases }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)
  }
}

export const Author = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    let paramList: ([number, number])[] = Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList = paramList.concat([DEFAULT_PARAM_INDEX.AUTHOR, paramIndex])
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageParam = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    let paramList: ([number, number])[] = Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList = paramList.concat([DEFAULT_PARAM_INDEX.MESSAGE, paramIndex])
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Args = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    let paramList: ([number, number])[] = Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList = paramList.concat([DEFAULT_PARAM_INDEX.ARGS, paramIndex])
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Guild = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    let paramList: ([number, number])[] = Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList = paramList.concat([DEFAULT_PARAM_INDEX.GUILD, paramIndex])
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}
