import { LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { Message, PermissionString } from 'discord.js'
import { INJECTABLE_METADATA } from '@/dep-injection-ioc/constants/di-connstants'
import { Type, GenericClassDecorator, Prototype } from '../dep-injection-ioc/interfaces/di-interfaces'

export enum FEATURE_SYMBOLS {
  CLIENT = 'client',
  MENTION = 'mention',
  ACTION = 'action',
  REQUEST_PARAMS = 'request-params',
}

const REFLECT_FEATURE_KEYS = {
  CLIENT_KEY: Symbol(FEATURE_SYMBOLS.CLIENT),
  MENTION_KEY: Symbol(FEATURE_SYMBOLS.MENTION),
  ACTION_KEY: Symbol(FEATURE_SYMBOLS.ACTION),
  REQUEST_KEY: Symbol(FEATURE_SYMBOLS.REQUEST_PARAMS),
}

export function FeatureServiceInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return function (target: Type<T>) {
    decoratorLogger(target.name, 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

export function FeaturePermissionValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(target.constructor.name, 'ValidateFeaturePermission', propertyKey)

    const originalDescriptor = descriptor.value

    descriptor.value = async function (..._args: any[]) {
      const message = _args[0] as Message

      const requiredPermissions: PermissionString[] = ['SEND_MESSAGES']
      const [yui, actionMember] = await Promise.all([message.guild.members.fetch(global.config.yuiId), message.member])

      const [yuiPermission, memberPermission, isOwner] = [
        yui.hasPermission([...requiredPermissions, 'MANAGE_MESSAGES'], {
          checkAdmin: true,
        }),
        actionMember.hasPermission(requiredPermissions, {
          checkAdmin: true,
          checkOwner: true,
        }),
        actionMember.user.id === global.config.ownerId,
      ]
      if (!(yuiPermission && (memberPermission || isOwner))) return

      const clientIndex = Reflect.getMetadata(REFLECT_FEATURE_KEYS.CLIENT_KEY, target, propertyKey)
      if (clientIndex) _args[clientIndex] = yui

      const mentionIndex = Reflect.getMetadata(REFLECT_FEATURE_KEYS.MENTION_KEY, target, propertyKey)
      if (mentionIndex) {
        const mentioned = message.mentions.members.array()

        const actionIndex = Reflect.getMetadata(REFLECT_FEATURE_KEYS.ACTION_KEY, target, propertyKey)

        const arrayArgs = _args[1] as Array<string>

        if (mentioned.length) {
          _args[mentionIndex] = mentioned.toString().split(',')
          const mentionedIds = mentioned.map((member) => member.id)

          const userAction = arrayArgs.filter((arg) => {
            const test = mentionedIds.filter((id) => {
              return new RegExp(id, 'i').test(arg)
            })
            return !test.length
          })

          if (actionIndex) _args[actionIndex] = userAction.shift()
          const paramsIndex = Reflect.getMetadata(REFLECT_FEATURE_KEYS.REQUEST_KEY, target, propertyKey)
          if (paramsIndex) _args[paramsIndex] = userAction.join(' ')
        } else {
          if (actionIndex) _args[actionIndex] = arrayArgs.shift()
          const paramsIndex = Reflect.getMetadata(REFLECT_FEATURE_KEYS.REQUEST_KEY, target, propertyKey)
          if (paramsIndex) _args[paramsIndex] = arrayArgs.join(' ')
        }
      }

      return originalDescriptor.apply(this, _args)
    }
  }
}

export const CurrentGuildMember = () => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_FEATURE_KEYS.CLIENT_KEY, paramIndex, target, propertyKey)
  }
}

export const MentionedUsers = () => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_FEATURE_KEYS.MENTION_KEY, paramIndex, target, propertyKey)
  }
}

export const UserAction = () => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_FEATURE_KEYS.ACTION_KEY, paramIndex, target, propertyKey)
  }
}

export const RequestParams = () => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_FEATURE_KEYS.REQUEST_KEY, paramIndex, target, propertyKey)
  }
}
