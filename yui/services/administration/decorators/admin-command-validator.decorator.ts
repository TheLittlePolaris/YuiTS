import { Message } from 'discord.js';
import { createMethodDecorator, createParamDecorator, ExecutionContext } from '@tlp01/djs-ioc-container';

import { bold, sendDMMessage } from '../../utilities';

export const CommandValidator = createMethodDecorator((context: ExecutionContext) => {
  const [message, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  if (!inputArguments.length) {
    sendDMMessage(message, bold('You must specify which action to be executed.'));
    context.terminate();
  }
  return context;
});

export const AdminCommand = createParamDecorator(
  (context) => context.getOriginalArguments<[Message, string[]]>()[1][0]
);

export const AdminCommandArgs = createParamDecorator((context) =>
  context.getOriginalArguments<[Message, string[]]>()[1].slice(1)
);
