import {
  createMethodDecorator,
  createParamDecorator,
  ExecutionContext,
  METHOD_PARAM_METADATA,
  Prototype
} from '@/ioc-container'
import { Message, PermissionString } from 'discord.js'

export enum FEATURE_PROPERTY_PARAMS {
  GUILD_MEMBER = 'guildMember',
  MENTIONS = 'mentions',
  ACTION = 'actions',
  REQUEST_PARAM = 'requestParam'
}

export type FEATURE_PARAM_NAME = Record<FEATURE_PROPERTY_PARAMS, string>
export type FEATURE_PARAM_KEY = keyof typeof FEATURE_PROPERTY_PARAMS

export const Feature = createMethodDecorator(async (context: ExecutionContext) => {
  const [message, params] = context.getOriginalArguments()
  const compiledArgs = context.getArguments()
  const discordClient = context.client

  const { target, propertyKey } = context.getContextMetadata()
  const requiredPermissions: PermissionString[] = ['SEND_MESSAGES']
  const [yui, actionMember] = await Promise.all([message.guild.members.fetch(discordClient.user.id), message.member])
  const [yuiPermission, memberPermission, isOwner] = [
    yui.permissions.has([...requiredPermissions, 'MANAGE_MESSAGES'], true),
    actionMember.permissions.has(requiredPermissions, true),
    actionMember.user.id === discordClient.user.id
  ]
  if (!(yuiPermission && (memberPermission || isOwner))) {
    context.terminate()
    return context
  }

  const paramIndexes: { [key: string]: number } = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}

  const clientIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.GUILD_MEMBER]
  if (clientIndex) compiledArgs[clientIndex] = yui

  const mentionIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.MENTIONS]

  if (!mentionIndex) return context

  const mentioned = message.mentions.members

  const actionIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.ACTION]
  const requestIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.REQUEST_PARAM]

  if (mentioned.size) {
    compiledArgs[mentionIndex] = mentioned.map((m) => m.toString())

    const mentionedIds = mentioned.map((member) => member.id)
    const userAction = params.filter((arg) => {
      const test = mentionedIds.filter((id) => {
        return new RegExp(id, 'i').test(arg)
      })
      return !test.length
    })
    if (actionIndex) compiledArgs[actionIndex] = userAction.shift()
    if (requestIndex) compiledArgs[requestIndex] = (userAction.length && userAction.join(' ')) || ''
  } else {
    if (actionIndex) compiledArgs[actionIndex] = params.shift()
    if (requestIndex) compiledArgs[requestIndex] = (params.length && params.join(' ')) || ''
  }
  return context
})

export const GetParam = (key: FEATURE_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [FEATURE_PROPERTY_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}

export const GuildMem = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message]>()
  return message.member
})

export const Mentions = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message]>()
  return message.mentions.members
})
