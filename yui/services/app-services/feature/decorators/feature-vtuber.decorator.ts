import {
  holoStatFunctionalCommands,
  holoStatRegions,
  HoloStatRegions
} from '@/services/app-services/feature/vtuberstats/holostat-service/holostat.interface'
import { createMethodDecorator, createParamDecorator, ExecutionContext } from '@/ioc-container'
import { Message } from 'discord.js'
import { startCase } from 'lodash'

export const Holostat = createMethodDecorator((context: ExecutionContext) => {
  return context
})

export const HoloRegion = createParamDecorator((ctx) => {
  const [_, args] = ctx.getOriginalArguments<[Message, string[]]>()
  if (!args.length) return HoloStatRegions.Japan
  const regionOrCode = args
    .find((arg) => holoStatRegions.includes(arg.toLowerCase()))
    ?.toLowerCase()
  if (!regionOrCode) return HoloStatRegions.Japan
  return regionOrCode.length > 2 ? HoloStatRegions[startCase(regionOrCode)] : regionOrCode
})

export const HoloDetail = createParamDecorator((ctx) => {
  const [_, args] = ctx.getOriginalArguments<[Message, string[]]>()
  if (!args.length) return false
  return (
    (args.find((arg) => holoStatFunctionalCommands.includes(arg.toLowerCase())) && true) || false
  )
})
