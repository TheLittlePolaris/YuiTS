import { DiscordEvent } from '@/constants/discord-events'
import { ModuleOption } from '../interfaces/di-interfaces'

export enum MODULE_METADATA_KEY {
  MODULES = 'modules',
  PROVIDERS = 'providers',
  COMPONENTS = 'components',
  INTERCEPTOR = 'interceptors',
  ENTRY_COMPONENT = 'entryComponent',
}

export const MODULE_METADATA = {
  [MODULE_METADATA_KEY.MODULES]: 'self:metadata:modules',
  [MODULE_METADATA_KEY.PROVIDERS]: 'self:metadata:providers',
  [MODULE_METADATA_KEY.COMPONENTS]: 'self:metadata:components',
  [MODULE_METADATA_KEY.INTERCEPTOR]: 'self:metadata:interceptors',
  [MODULE_METADATA_KEY.ENTRY_COMPONENT]: 'self:metadata:entry_component',
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

export const APP_INTERCEPTOR = 'design:interceptor'

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

// Event handlers
export const BOUND_EVENTS = 'self:bound_events'
export const EVENT_HANDLER = 'self:event_handler'
export const COMMAND_HANDLER = 'self:command_handler'
export const COMMAND_HANDLER_PARAMS = 'self:command_handler:params'

export enum MESSAGE_PARAMS {
  MESSAGE,
  AUTHOR,
  ARGS,
  GUILD,
  CHANNEL,
  COMMAND,
}

export enum VOICESTATE_PARAMS {
  OLD_STATE,
  NEW_STATE,
  OLD_CHANNEL,
  NEW_CHANNEL,
}

export const INTERCEPTOR_TARGET = 'self:interceptor_target'