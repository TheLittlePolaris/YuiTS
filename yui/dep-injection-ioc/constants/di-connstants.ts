import { DiscordEvent } from '@/constants/discord-events'

export const MODULE_METADATA = {
  MODULES: 'modules',
  PROVIDERS: 'providers',
  COMPONENTS: 'components',
  ENTRY_COMPONENT: 'entryComponent',
}

export const COMPONENT_METADATA = {
  EVENT_LIST: 'custom_metadata:event_list',
  PROPERT: 'custom_type:property',
  METHOD: 'custom_type:method',
  CLIENT: 'custom_param:client',
}

export const paramKeyConstructor = (eventName: DiscordEvent, propertyKey: string) =>
  `event_key:${eventName}:${propertyKey}`

export const INJECTABLE_METADATA = 'injectable-metadata'
export const PARAMTYPES_METADATA = 'design:paramtypes'
export const SELF_DECLARED_DEPS_METADATA = 'self:paramtypes'
export const OPTIONAL_DEPS_METADATA = 'optional:paramtypes'
export const PROPERTY_DEPS_METADATA = 'self:properties_metadata'
export const OPTIONAL_PROPERTY_DEPS_METADATA = 'optional:properties_metadata'
export const SCOPE_OPTIONS_METADATA = 'scope:options'
export const DESIGN_TYPE = 'design:type'

export const METHOD_PARAM_METADATA = 'method:params'

export enum GlobalInjectToken {
  BOT_TOKEN = 'BOT_TOKEN',
  BOT_OPTION = 'BOT_OPTION',
  BOT_PREFIX = 'BOT_PREFIX',
  YOUTUBE_API_KEY = 'YOUTUBE_API_KEY',
  YUI_CLIENT = 'YUI_CLIENT',
  GLOBAL_STREAMS = 'GLOBAL_STREAMS',
}

export type InjectTokenValue = Record<GlobalInjectToken, string>
export type InjectTokenName = keyof typeof GlobalInjectToken

export const EVENT_HANDLER = 'event:handler'

export enum HANDLE_PARAMS {
  MESSAGE = 'message',
  AUTHOR = 'author',
  ARGS = 'args',
}