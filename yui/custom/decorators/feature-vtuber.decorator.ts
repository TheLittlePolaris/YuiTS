import {
  holoStatRegionSubCommand,
  defaultDetailSubCommand,
  HOLOSTAT_PARAMS,
  holoStatList
} from '@/services/app-services/feature/vtuberstat-service/holostat-service/holostat.interface'
import { METHOD_PARAM_METADATA } from '@/ioc-container/constants/dependencies-injection.constant'
import { createMethodDecorator, ExecutionContext, Prototype } from '@/ioc-container'

export enum VTUBER_PARAMS {
  REGION = 'region',
  DETAIL = 'detail'
}

export type VTUBER_PARAM_NAME = Record<VTUBER_PARAMS, string>
export type VTUBER_PARAM_KEY = keyof typeof VTUBER_PARAMS

export const VTuberParam = (key: VTUBER_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [VTUBER_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
    console.log('RUN: paramDecorator', target.constructor.name, propertyKey, paramIndex)
  }
}

export const Holostat = createMethodDecorator((context: ExecutionContext) => {
  const [message, params] = context.getOriginalArguments()
  const compiledArgs = context.getArguments()
  const { target, propertyKey } = context.getContextMetadata()

  const holoStatCommands = [...holoStatRegionSubCommand, ...defaultDetailSubCommand]
  const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey)

  const regionIndex = paramIndexes[VTUBER_PARAMS.REGION]

  if (!params.length) {
    if (regionIndex) compiledArgs[regionIndex] = 'jp'
    return context
  }

  const subCommand: HOLOSTAT_PARAMS = params.shift().toLowerCase() as HOLOSTAT_PARAMS
  if (!holoStatCommands.includes(subCommand)) {
    message.channel.send(`*${subCommand} is not recognized as an option.*`)
    return context
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
    if (!params.length) return context
    const regionArg = params.shift().toLowerCase() as Exclude<HOLOSTAT_PARAMS, 'd' | 'detail'>
    compiledArgs[regionIndex] = getRegion(regionArg)
    return context
  }

  // else sub command is a region, try if there is a 'detail' param`
  compiledArgs[regionIndex] = getRegion(subCommand)
  if (!params.length) return context

  const detailArg = params.shift().toLowerCase()
  if (!defaultDetailSubCommand.includes(detailArg)) {
    return context
  }
  compiledArgs[detailIndex] = true

  return context
})
