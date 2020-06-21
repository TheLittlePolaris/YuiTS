/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TFunction, HOLOSTAT_PARAMS } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { Message } from 'discord.js'
import { HOLOSTAT_SUB_COMMANDS } from '@/constants/constants'

enum HOLOSTAT_REFLECT_SYMBOLS {
  SUB_COMMAND = 'sub-command',
  REGION = 'region',
  DETAIL = 'detail',
}

const REFECT_HOLOSTAT_KEYS = {
  SUB_COMMAND_KEY: Symbol(HOLOSTAT_REFLECT_SYMBOLS.SUB_COMMAND),
  REGION_KEY: Symbol(HOLOSTAT_REFLECT_SYMBOLS.REGION),
  DETAIL_KEY: Symbol(HOLOSTAT_REFLECT_SYMBOLS.DETAIL),
}

export function HoloStatServiceInitiator() {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {}
  }
}

export function HoloStatCommandValidator() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = function (..._args: any[]) {
      const [message, args] = _args as [Message, Array<string>]

      const regionIndex = Reflect.getMetadata(
        REFECT_HOLOSTAT_KEYS.REGION_KEY,
        target,
        propertyKey
      )
      if (!args.length) {
        if (regionIndex) _args[regionIndex] = 'jp'
        return originalMethod.apply(this, _args)
      }

      const subCommand: HOLOSTAT_PARAMS = args
        .shift()
        .toLowerCase() as HOLOSTAT_PARAMS
      if (!HOLOSTAT_SUB_COMMANDS.includes(subCommand)) {
        message.channel.send(`*${subCommand} is not recognized as an option.*`)
        return
      }

      const detailIndex = Reflect.getMetadata(
        REFECT_HOLOSTAT_KEYS.DETAIL_KEY,
        target,
        propertyKey
      )

      const getRegion = (region: HOLOSTAT_PARAMS) => {
        switch (region) {
          case 'id':
          case 'indonesia': {
            return 'id'
          }
          case 'jp':
          case 'japan':
          default: {
            return 'jp'
          }
        }
      }

      // region w/o detail: print all from region, detail w/o region: ask for region

      // if sub command is detail, try to get region, default to 'jp'
      if (['detail', 'd'].includes(subCommand)) {
        _args[detailIndex] = true
        if (!args.length) return originalMethod.apply(this, _args)
        const regionArg: HOLOSTAT_PARAMS = args
          .shift()
          .toLowerCase() as HOLOSTAT_PARAMS
        _args[regionIndex] = getRegion(regionArg)
        return originalMethod.apply(this, _args)
      }

      // else sub command is a region, try if there is a 'detail' param
      _args[regionIndex] = getRegion(subCommand)

      if (!args.length) return originalMethod.apply(this, _args)

      const detailArg = args.shift().toLowerCase()
      if (!['detail', 'd'].includes(detailArg)) {
        return originalMethod.apply(this, _args)
      }
      _args[detailIndex] = true
      return originalMethod.apply(this, _args)
    }
  }
}

// export const SubCommand = () => {
//   return (target: any, propertyKey: string, paramIndex: number) => {
//     Reflect.defineMetadata(
//       REFECT_HOLOSTAT_KEYS.SUB_COMMAND_KEY,
//       paramIndex,
//       target,
//       propertyKey
//     )
//   }
// }

export const Region = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFECT_HOLOSTAT_KEYS.REGION_KEY,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const Detail = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFECT_HOLOSTAT_KEYS.DETAIL_KEY,
      paramIndex,
      target,
      propertyKey
    )
  }
}
