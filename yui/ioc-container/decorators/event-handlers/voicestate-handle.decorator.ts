import { ClientEvents } from 'discord.js'

import { COMMAND_HANDLER, DEFAULT_ACTION_KEY } from '../../constants'
import { ICommandHandlerMetadata, Prototype } from '../../interfaces'
import { createMethodDecorator, createParamDecorator, VoiceStateKey } from '../../helpers'
import { ExecutionContext } from '../../event-execution-context'

export const HandleVoiceState = createMethodDecorator(
  (context: ExecutionContext) => {
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
