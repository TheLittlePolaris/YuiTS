import { Message } from 'discord.js'
import {
  holoStatRegionSubCommand,
  defaultDetailSubCommand,
  HOLOSTAT_PARAMS,
  holoStatList,
} from '@/services/app-services/feature/vtuberstat-service/holostat-service/holostat.interface'
import { METHOD_PARAM_METADATA } from '@/ioc-container/constants/dependencies-injection.constant'
import { Prototype } from '@/ioc-container'

export enum VTUBER_PARAMS {
  REGION = 'region',
  DETAIL = 'detail',
}

export type VTUBER_PARAM_NAME = Record<VTUBER_PARAMS, string>
export type VTUBER_PARAM_KEY = keyof typeof VTUBER_PARAMS

export function HoloStatCommandValidator() {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    descriptor.value = function (message: Message, params: string[], ...args: any[]) {
      const filteredArgs = [message, params, ...args]
      const holoStatCommands = [...holoStatRegionSubCommand, ...defaultDetailSubCommand]
      const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey)

      const regionIndex = paramIndexes[VTUBER_PARAMS.REGION]

      if (!params.length) {
        if (regionIndex) filteredArgs[regionIndex] = 'jp'
        return originalMethod.apply(this, filteredArgs)
      }

      const subCommand: HOLOSTAT_PARAMS = params.shift().toLowerCase() as HOLOSTAT_PARAMS
      if (!holoStatCommands.includes(subCommand)) {
        message.channel.send(`*${subCommand} is not recognized as an option.*`)
        return
      }

      const detailIndex = paramIndexes[VTUBER_PARAMS.DETAIL]

      const getRegion = (region: HOLOSTAT_PARAMS) => {
        if (holoStatList[region]) return holoStatList[region].code
        const key = Object.keys(holoStatList).find(
          (k) => holoStatList[k].name.toLowerCase() === region
        )
        if (!key) return 'jp' // default
        return holoStatList[key].code
      }

      // if sub command is detail, try to get region, default to 'jp'
      if (defaultDetailSubCommand.includes(subCommand)) {
        filteredArgs[detailIndex] = true
        if (!params.length) return originalMethod.apply(this, filteredArgs)
        const regionArg = params.shift().toLowerCase() as Exclude<HOLOSTAT_PARAMS, 'd' | 'detail'>
        filteredArgs[regionIndex] = getRegion(regionArg)
        return originalMethod.apply(this, filteredArgs)
      }

      // else sub command is a region, try if there is a 'detail' param`
      filteredArgs[regionIndex] = getRegion(subCommand)
      if (!params.length) return originalMethod.apply(this, filteredArgs)

      const detailArg = params.shift().toLowerCase()
      if (!defaultDetailSubCommand.includes(detailArg)) {
        return originalMethod.apply(this, filteredArgs)
      }
      filteredArgs[detailIndex] = true
      return originalMethod.apply(this, filteredArgs)
    }
  }
}

export const VTuberParam = (key: VTUBER_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [VTUBER_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}
