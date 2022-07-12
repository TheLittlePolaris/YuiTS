import { Message } from 'discord.js'
import { createMethodDecorator, ExecutionContext, createParamDecorator } from '@/ioc-container'
import { messageMentionRegexp, messageMentionRoleRegex } from '@/constants'

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
  return args
    .filter((arg) => !(messageMentionRegexp.test(arg) || messageMentionRoleRegex.test(arg)))
    .join(' ')
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
  return args
    .filter((arg) => !(messageMentionRegexp.test(arg) && messageMentionRoleRegex.test(arg)))
    .join(' ')
})
