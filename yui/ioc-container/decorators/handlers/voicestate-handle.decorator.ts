import { ClientEvents } from 'discord.js'

import { COMMAND_HANDLER, DEFAULT_ACTION_KEY } from '../../constants'
import { ICommandHandlerMetadata, Prototype } from '../../interfaces'
import { ExecutionContext } from '../../event-execution-context'
import { createMethodDecorator, createParamDecorator } from '../generators'

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

const getArgsCtx = (ctx: ExecutionContext) => ctx.getOriginalArguments<ClientEvents['voiceStateUpdate']>()

export const OldState = createParamDecorator((ctx) => getArgsCtx(ctx)[0])
export const OldStateChannel = createParamDecorator((ctx) => getArgsCtx(ctx)[0]?.channel)
export const NewState = createParamDecorator((ctx) => getArgsCtx(ctx)[1])
export const NewStateChannel = createParamDecorator((ctx) => getArgsCtx(ctx)[1]?.channel)
