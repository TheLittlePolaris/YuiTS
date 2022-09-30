import { createMethodDecorator, createParamDecorator, ExecutionContext } from 'djs-ioc-container';
import { Message } from 'discord.js';
import { startCase } from 'lodash';

import { holoStatFunctionalCommands, holoStatRegions, HoloStatRegions } from '../vtuberstats';

export const Holostat = createMethodDecorator((context: ExecutionContext) => context);

export const HoloRegion = createParamDecorator((context) => {
  const [_, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  if (!inputArguments.length) return HoloStatRegions.Japan;

  const regionOrCode = inputArguments
    .find((argument) => holoStatRegions.includes(argument.toLowerCase()))
    ?.toLowerCase();
  if (!regionOrCode) return HoloStatRegions.Japan;

  return regionOrCode.length > 2 ? HoloStatRegions[startCase(regionOrCode)] : regionOrCode;
});

export const HoloDetail = createParamDecorator((context) => {
  const [_, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  if (!inputArguments.length) return false;

  return (
    (inputArguments.find((argument) =>
      holoStatFunctionalCommands.includes(argument.toLowerCase())
    ) &&
      true) ||
    false
  );
});
