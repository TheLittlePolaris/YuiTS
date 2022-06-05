import { Message } from 'discord.js'
import {
  holoStatRegionSubCommand,
  defaultDetailSubCommand,
  HOLOSTAT_PARAMS,
  holoStatList
} from '@/services/app-services/feature/vtuberstat-service/holostat-service/holostat.interface'
import { METHOD_PARAM_METADATA } from '@/ioc-container/constants/dependencies-injection.constant'
import { createMethodDecorator, DiscordClient, Prototype } from '@/ioc-container'
import { ConfigService } from '@/config-service/config.service'

export enum VTUBER_PARAMS {
  REGION = 'region',
  DETAIL = 'detail'
}

export type VTUBER_PARAM_NAME = Record<VTUBER_PARAMS, string>
export type VTUBER_PARAM_KEY = keyof typeof VTUBER_PARAMS

export const NewHolostat = createMethodDecorator(
  async (
    [target, propertyKey, descriptor]: [Prototype, string, TypedPropertyDescriptor<Function>],
    compiledArgs: any[],
    [_config, discordClient, originalArgs]: [
      ConfigService,
      DiscordClient,
      [message: Message, params: string[], ...args: any[]]
    ]
  ) => {
    const [message, params] = originalArgs
    const holoStatCommands = [...holoStatRegionSubCommand, ...defaultDetailSubCommand]
    const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey)

    const regionIndex = paramIndexes[VTUBER_PARAMS.REGION]

    if (!params.length) {
      if (regionIndex) compiledArgs[regionIndex] = 'jp'
      return [descriptor.value, compiledArgs]
    }

    const subCommand: HOLOSTAT_PARAMS = params.shift().toLowerCase() as HOLOSTAT_PARAMS
    if (!holoStatCommands.includes(subCommand)) {
      message.channel.send(`*${subCommand} is not recognized as an option.*`)
      return [descriptor.value, compiledArgs]
    }

    const detailIndex = paramIndexes[VTUBER_PARAMS.DETAIL]

    const getRegion = (region: HOLOSTAT_PARAMS) => {
      if (holoStatList[region]) return holoStatList[region].code
      const key = Object.keys(holoStatList).find((k) => holoStatList[k].name.toLowerCase() === region)
      if (!key) return 'jp' // default
      return holoStatList[key].code
    }

    // if sub command is detail, try to get region, default to 'jp'
    if (defaultDetailSubCommand.includes(subCommand)) {
      compiledArgs[detailIndex] = true
      if (!params.length) return [descriptor.value, compiledArgs]
      const regionArg = params.shift().toLowerCase() as Exclude<HOLOSTAT_PARAMS, 'd' | 'detail'>
      compiledArgs[regionIndex] = getRegion(regionArg)
      return [descriptor.value, compiledArgs]
    }

    // else sub command is a region, try if there is a 'detail' param`
    compiledArgs[regionIndex] = getRegion(subCommand)
    if (!params.length) return [descriptor.value, compiledArgs]

    const detailArg = params.shift().toLowerCase()
    if (!defaultDetailSubCommand.includes(detailArg)) {
      return [descriptor.value, compiledArgs]
    }
    compiledArgs[detailIndex] = true
    return [descriptor.value, compiledArgs]
  }
)

export const VTuberParam = (key: VTUBER_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [VTUBER_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}
