import { TFunction, HOLOSTAT_REGION } from '@/constants/constants'
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
    const originalMethod: Function = descriptor.value

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

      const subCommand: HOLOSTAT_REGION = args.shift() as HOLOSTAT_REGION
      if (!HOLOSTAT_SUB_COMMANDS.includes(subCommand)) {
        message.channel.send(`**Unknown option ${subCommand}**`)
        return
      }

      const detailIndex = Reflect.getMetadata(
        REFECT_HOLOSTAT_KEYS.DETAIL_KEY,
        target,
        propertyKey
      )

      const getRegion = (region: HOLOSTAT_REGION) => {
        if (!HOLOSTAT_SUB_COMMANDS.includes(region)) {
          message.channel.send(`**Unknown option ${region}**`)
          return
        }
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
      if (subCommand === 'detail') {
        _args[detailIndex] = true
        if (!args.length) return originalMethod.apply(this, _args)
        const regionArg: HOLOSTAT_REGION = args.shift() as HOLOSTAT_REGION
        _args[regionIndex] = getRegion(regionArg)
        return originalMethod.apply(this, _args)
      }

      // else sub command is a region, try if there is a 'detail' param
      _args[regionIndex] = getRegion(subCommand)

      if (!args.length) return originalMethod.apply(this, _args)

      const detailArg = args.shift()
      if (detailArg !== 'detail') {
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
