import { ConfigService } from '@/config-service/config.service'
import { Prototype, Type } from '@/ioc-container/interfaces/di-interfaces'
import { decoratorLogger } from '@/ioc-container/log/logger'
import { ClientEvents } from 'discord.js'
import {
  EVENT_HANDLER,
  COMMAND_HANDLER,
  COMMAND_HANDLER_PARAMS,
  DEFAULT_PARAM_INDEX,
} from '../constants/di-connstants'
import { ICommandHandlerMetadata } from '../interfaces/di-command-handler.interface'

export function Handle(event: keyof ClientEvents) {
  return (target: Type<any>) => {
    // decoratorLogger(target.constructor.name, 'Class')
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
  }
}

export function HandleMessage(command = 'default', ...aliases: string[]) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command, commandAliases: aliases }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)

    const originalHandler = descriptor.value as Function
    descriptor.value = function ([message]: ClientEvents['message'], config: ConfigService) {
      const [_command, ..._args] = message.content.replace(config.prefix, '').trim().split(/ +/g)

      const paramList =
        Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
      const { channel, author, guild } = message
      const defaultIndex = [message, author, _args, guild, channel, command]
      const compiledArgs = (paramList.length && paramList.map((i) => defaultIndex[i])) || [message]
      return originalHandler.apply(this, compiledArgs)
    }
  }
}

export const Author = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.AUTHOR)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageParam = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.MESSAGE)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Args = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.ARGS)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageGuild = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.GUILD)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageChannel = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.CHANNEL)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Command = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(DEFAULT_PARAM_INDEX.COMMAND)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}
