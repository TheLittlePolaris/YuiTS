import { DiscordEvent } from '@/constants/discord-events'

export const MODULE_METADATA = {
  MODULES: 'self:metadata:modules',
  PROVIDERS: 'self:metadata:providers',
  COMPONENTS: 'self:metadata:components',
  INJECTORS: 'self:metadata:injectors',
  ENTRY_COMPONENT: 'self:metadata:entry_component',
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

export enum HANDLE_PARAMS {
  MESSAGE = 'params:message',
  AUTHOR = 'params:author',
  ARGS = 'params:args',
  GUILD = 'params:guild',
}


export enum DEFAULT_PARAM_INDEX {
  MESSAGE,
  AUTHOR,
  ARGS,
  GUILD
}

export const INTERCEPTOR_TARGET = 'self:interceptor_target'