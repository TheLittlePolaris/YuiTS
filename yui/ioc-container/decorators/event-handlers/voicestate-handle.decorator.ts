import { ConfigService } from '@/config-service/config.service'
import {
  COMMAND_HANDLER,
  COMMAND_HANDLER_PARAMS,
  VOICESTATE_PARAMS,
} from '@/ioc-container/constants/di-connstants'
import { ICommandHandlerMetadata } from '@/ioc-container/interfaces/event-handler-dep-injection.interface'
import { Prototype } from '@/ioc-container/interfaces/dependencies-injection.interfaces'
import { ClientEvents } from 'discord.js'

export function HandleVoiceState() {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command: 'default' }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)

    const originalHandler = descriptor.value as Function
    descriptor.value = function (
      [oldState, newState]: ClientEvents['voiceStateUpdate'],
      config: ConfigService
    ) {
      const paramList =
        Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []

      const defaultIndex = [oldState, newState, oldState.channel, newState.channel]
      const compiledArgs = (paramList.length && paramList.map((i) => defaultIndex[i])) || [
        oldState,
        newState,
      ]
      compiledArgs.push([oldState, newState], config)
      return originalHandler.apply(this, compiledArgs)
    }
  }
}

export const State = (type: 'old' | 'new') => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(type === 'old' ? VOICESTATE_PARAMS.OLD_STATE : VOICESTATE_PARAMS.NEW_STATE)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const StateChannel = (type: 'old' | 'new') => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(
      type === 'old' ? VOICESTATE_PARAMS.OLD_CHANNEL : VOICESTATE_PARAMS.NEW_CHANNEL
    )
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}
