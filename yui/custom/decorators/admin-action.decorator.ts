import { Message } from 'discord.js'
import {
  Prototype,
  METHOD_PARAM_METADATA,
  createMethodDecorator,
  ExecutionContext,
  createParamDecorator
} from '@/ioc-container'

enum ADMIN_PARAMS {
  REASON = 'reason',
  TARGETS = 'targets',
  ROLES = 'roles',
  NICKNAME = 'nickname',
  EXECUTOR = 'executor'
}

const roleRegexp = /^<@&\d+>$/
const mentionRegexp = /^<@\d+>$/

export type ADMIN_PARAM_NAME = Record<ADMIN_PARAMS, string>
export type ADMIN_PARAM_KEY = keyof typeof ADMIN_PARAMS

export const AdminParam = (key: ADMIN_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [ADMIN_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}

export const AdminCommandValidator = createMethodDecorator((ctx: ExecutionContext) => {
  return ctx
})

export const Targets = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message]>()
  return message.mentions.members
})

export const CmdExecutor = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message]>()
  return message.member
})

export const Reason = createParamDecorator((ctx) => {
  const [_, args] = ctx.getOriginalArguments<[Message, string[]]>()
  return args.filter((arg) => !(mentionRegexp.test(arg) || roleRegexp.test(arg))).join(' ')
})

export const SubCommand = createParamDecorator((ctx) => {
  return ctx.propertyKey
})

export const MentionedRoles = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message, string[]]>()
  return message.mentions.roles
})

export const Nickname = createParamDecorator((ctx) => {
  const [_, args] = ctx.getOriginalArguments<[Message, string[]]>()
  return args.filter((arg) => !(mentionRegexp.test(arg) && roleRegexp.test(arg))).join(' ')
})
