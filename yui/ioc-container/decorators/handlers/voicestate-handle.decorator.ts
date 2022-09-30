import { ClientEvents } from 'discord.js';

import { COMMAND_HANDLER, DEFAULT_ACTION_KEY } from '../../constants';
import { ICommandHandlerMetadata, Prototype } from '../../interfaces';
import { ExecutionContext } from '../../event-execution-context';
import {
  createMethodDecorator,
  createParamDecorator as createParameterDecorator
} from '../generators';

export const HandleVoiceState = createMethodDecorator(
  (context: ExecutionContext) => context,
  (target: Prototype, propertyKey: string) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || [];
    commands = [...commands, { propertyKey, command: DEFAULT_ACTION_KEY }];
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor);
  }
);

const getArgumentsContext = (context: ExecutionContext) =>
  context.getOriginalArguments<ClientEvents['voiceStateUpdate']>();

export const OldState = createParameterDecorator((context) => getArgumentsContext(context)[0]);
export const OldStateChannel = createParameterDecorator(
  (context) => getArgumentsContext(context)[0]?.channel
);
export const NewState = createParameterDecorator((context) => getArgumentsContext(context)[1]);
export const NewStateChannel = createParameterDecorator(
  (context) => getArgumentsContext(context)[1]?.channel
);
