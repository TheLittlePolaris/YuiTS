/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TFunction } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { Message } from 'discord.js'
import {
  holoStatRegionSubCommand,
  holoStatDetailSubCommand,
  HOLOSTAT_PARAMS,
} from '@/handlers/services/feature/vtuberstat-service/holostat-service/holostat.interface'
import {
  NIJISTAT_PARAMS,
  nijiStatRegionSubCommand,
  nijiStatDetailSubCommand,
} from '@/handlers/services/feature/vtuberstat-service/nijistat-service/nijistat.interface'
import { HoloStatRequestService } from '@/handlers/services/feature/vtuberstat-service/holostat-service/holostat-request.service'
import { NijiStatRequestService } from '@/handlers/services/feature/vtuberstat-service/nijistat-service/nijistat-request.service'
import { BaseChannelService } from '@/handlers/services/feature/vtuberstat-service/channel-service/base-channel.service'

enum REFLECT_SYMBOLS {
  SUB_COMMAND = 'sub-command',
  REGION = 'region',
  DETAIL = 'detail',
}

const REFLECT_KEYS = {
  SUB_COMMAND_KEY: Symbol(REFLECT_SYMBOLS.SUB_COMMAND),
  REGION_KEY: Symbol(REFLECT_SYMBOLS.REGION),
  DETAIL_KEY: Symbol(REFLECT_SYMBOLS.DETAIL),
}

export function VtuberStatServiceInitiator() {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {
      _name = superClass['name']
      _holostatRequestService = new HoloStatRequestService()
      _nijistatRequestService = new NijiStatRequestService()
      _baseChannelService = new BaseChannelService()
    }
  }
}

export function HoloStatCommandValidator() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (..._args: any[]) {
      const [message, args] = _args as [Message, Array<string>]

      const holoStatCommands = [...holoStatRegionSubCommand, ...holoStatDetailSubCommand]

      const regionIndex = Reflect.getMetadata(REFLECT_KEYS.REGION_KEY, target, propertyKey)
      if (!args.length) {
        if (regionIndex) _args[regionIndex] = 'jp'
        return originalMethod.apply(this, _args)
      }

      const subCommand: HOLOSTAT_PARAMS = args.shift().toLowerCase() as HOLOSTAT_PARAMS
      if (!holoStatCommands.includes(subCommand)) {
        message.channel.send(`*${subCommand} is not recognized as an option.*`)
        return
      }

      const detailIndex = Reflect.getMetadata(REFLECT_KEYS.DETAIL_KEY, target, propertyKey)

      const getRegion = (region: HOLOSTAT_PARAMS) => {
        switch (region) {
          case 'id':
          case 'indonesia': {
            return 'id'
          }
          case 'cn':
          case 'china': {
            return 'cn'
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
        const regionArg = args.shift().toLowerCase() as Exclude<NIJISTAT_PARAMS, 'd' | 'detail'>
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

export function NijiStatCommandValidator() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (..._args: any[]) {
      const [message, args] = _args as [Message, Array<string>]

      const nijiStatCommand = [...nijiStatRegionSubCommand, ...nijiStatDetailSubCommand]

      const regionIndex = Reflect.getMetadata(REFLECT_KEYS.REGION_KEY, target, propertyKey)
      if (!args.length) {
        if (regionIndex) _args[regionIndex] = 'jp'
        return originalMethod.apply(this, _args)
      }

      const subCommand: NIJISTAT_PARAMS = args.shift().toLowerCase() as NIJISTAT_PARAMS
      if (!nijiStatCommand.includes(subCommand)) {
        message.channel.send(`*${subCommand} is not recognized as an option.*`)
        return
      }

      const detailIndex = Reflect.getMetadata(REFLECT_KEYS.DETAIL_KEY, target, propertyKey)

      const getRegion = (region: NIJISTAT_PARAMS) => {
        switch (region) {
          case 'id':
          case 'indonesia': {
            return 'id'
          }
          case 'cn':
          case 'china': {
            return 'cn'
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
        const regionArg = args.shift().toLowerCase() as Exclude<NIJISTAT_PARAMS, 'd' | 'detail'>
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
    Reflect.defineMetadata(REFLECT_KEYS.REGION_KEY, paramIndex, target, propertyKey)
  }
}

export const Detail = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_KEYS.DETAIL_KEY, paramIndex, target, propertyKey)
  }
}
