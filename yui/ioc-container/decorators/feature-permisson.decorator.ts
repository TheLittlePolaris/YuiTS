import { Message, PermissionString } from 'discord.js'
import {
  METHOD_PARAM_METADATA,
} from '@/ioc-container/constants/di-connstants'
import {

  Prototype,
} from '../interfaces/dependencies-injection.interfaces'
import { FeatureService } from '@/services/app-services/feature/feature.service'

export enum FEATURE_PROPERTY_PARAMS {
  GUILD_MEMBER = 'guildMember',
  MENTIONS = 'mentions',
  ACTION = 'actions',
  REQUEST_PARAM = 'requestParam',
}

export type FEATURE_PARAM_NAME = Record<FEATURE_PROPERTY_PARAMS, string>
export type FEATURE_PARAM_KEY = keyof typeof FEATURE_PROPERTY_PARAMS



export function FeaturePermissionValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {

    const originalDescriptor: Function = descriptor.value
    descriptor.value = async function (this: FeatureService, message: Message, params: string[], ...args: any[]) {

      const filteredArgs = [message, params, ...args]
      const requiredPermissions: PermissionString[] = ['SEND_MESSAGES']
      const [yui, actionMember] = await Promise.all([
        message.guild.members.fetch(this.yui.user.id),
        message.member,
      ])
      const [yuiPermission, memberPermission, isOwner] = [
        yui.hasPermission([...requiredPermissions, 'MANAGE_MESSAGES'], {
          checkAdmin: true,
        }),
        actionMember.hasPermission(requiredPermissions, {
          checkAdmin: true,
          checkOwner: true,
        }),
        actionMember.user.id === this.yui.user.id,
      ]
      if (!(yuiPermission && (memberPermission || isOwner))) return

      const paramIndexes: { [key: string]: number } =
        Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}

      const clientIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.GUILD_MEMBER]
      if (clientIndex) filteredArgs[clientIndex] = yui

      const mentionIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.MENTIONS]
      if (!mentionIndex) return originalDescriptor.apply(this, filteredArgs)

      const mentioned = message.mentions.members.array()

      const actionIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.ACTION]
      const requestIndex = paramIndexes[FEATURE_PROPERTY_PARAMS.REQUEST_PARAM]

      if (mentioned.length) {
        filteredArgs[mentionIndex] = mentioned.toString().split(',')
        const mentionedIds = mentioned.map((member) => member.id)
        const userAction = params.filter((arg) => {
          const test = mentionedIds.filter((id) => {
            return new RegExp(id, 'i').test(arg)
          })
          return !test.length
        })
        if (actionIndex) filteredArgs[actionIndex] = userAction.shift()
        if (requestIndex) filteredArgs[requestIndex] = userAction.join(' ')
      } else {
        if (actionIndex) filteredArgs[actionIndex] = params.shift()
        if (requestIndex) filteredArgs[requestIndex] = params.join(' ')
      }

      return originalDescriptor.apply(this, filteredArgs)
    }
  }
}

export const FeatureParam = (key: FEATURE_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [FEATURE_PROPERTY_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}
