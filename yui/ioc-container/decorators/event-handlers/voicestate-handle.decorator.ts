import { ClientEvents } from 'discord.js'

import { COMMAND_HANDLER, DEFAULT_ACTION_KEY, METHOD_PARAM_METADATA } from '../../constants'
import { ICommandHandlerMetadata, Prototype } from '../../interfaces'
import { createMethodDecorator, createParamDecorator, VoiceStateKey } from '../../helpers'
import { ExecutionContext } from '../../event-execution-context'
import { getParamDecoratorResolverValue } from '../../containers/params-decorator.container'

export const HandleVoiceState = createMethodDecorator(
  (context: ExecutionContext) => {
    const compiledArgs = context.getOriginalArguments<ClientEvents['voiceStateUpdate']>()

    const { target, propertyKey } = context.getContextMetadata()

    const paramResolverList: Record<string, number> =
      Reflect.getMetadata(METHOD_PARAM_METADATA, target.constructor, propertyKey) || []

    Object.entries(paramResolverList).forEach(([key, index]) => {
      const value = getParamDecoratorResolverValue(key, context)
      compiledArgs[index] = value
    })

    context.setArguments(compiledArgs)
    return context
  },
  (target: Prototype, propertyKey: string) => {
    let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command: DEFAULT_ACTION_KEY }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)
  }
)

export const State = (type: VoiceStateKey) =>
  createParamDecorator((context: ExecutionContext) => {
    const [oldState, newState] = context.getOriginalArguments() as ClientEvents['voiceStateUpdate']
    switch (type) {
      case VoiceStateKey.NewState:
        return newState
      case VoiceStateKey.NewStateChannel:
        return newState?.channel
      case VoiceStateKey.OldState:
        return oldState
      case VoiceStateKey.OldStateChannel:
        return oldState?.channel
      default:
        return newState
    }
  })()
