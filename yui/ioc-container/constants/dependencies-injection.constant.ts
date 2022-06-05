export const MODULE_METADATA_KEY_PREFIX = `self:metadata`

export const COMPONENT_METADATA = {
  EVENT_LIST: 'custom_metadata:event_list',
  PROPERT: 'custom_type:property',
  METHOD: 'custom_type:method',
  CLIENT: 'custom_param:client'
}

export const INJECTABLE_METADATA = 'injectable-metadata'
export const PARAMTYPES_METADATA = 'design:paramtypes'
export const SELF_DECLARED_DEPS_METADATA = 'self:paramtypes'
export const OPTIONAL_DEPS_METADATA = 'optional:paramtypes'
export const PROPERTY_DEPS_METADATA = 'self:properties_metadata'
export const OPTIONAL_PROPERTY_DEPS_METADATA = 'optional:properties_metadata'
export const SCOPE_OPTIONS_METADATA = 'scope:options'
export const DESIGN_TYPE = 'design:type'

export const METHOD_PARAM_METADATA = 'method:params'

export const CUSTOM_INTERCEPTOR = 'design:custom:interceptor'
export const INTERCEPTOR_TARGET = 'self:interceptor_target'

export enum InjectToken {
  CLIENT_TOKEN = 'BotToken',
  CLIENT_INTENTS = 'BotIntents',
  REDIS_CONFIG = 'RedisConfig',
  YUI_CLIENT = 'YuiClient'
}

// Event handlers
export const BOUND_EVENTS = 'self:bound_events'

export const EVENT_HANDLER = 'self:event_handler'
export const EVENT_HANDLER_CONFIG = 'self:event_handler_config'
export const COMMAND_HANDLER = 'self:command_handler'
export const COMMAND_HANDLER_PARAMS = 'self:command_handler:params'

export enum MESSAGE_PARAMS {
  MESSAGE,
  AUTHOR,
  ARGS,
  GUILD,
  CHANNEL,
  COMMAND
}

export enum VOICESTATE_PARAMS {
  OLD_STATE,
  NEW_STATE,
  OLD_CHANNEL,
  NEW_CHANNEL
}

export enum ModuleMetadata {
  MODULES = 'modules',
  PROVIDERS = 'providers',
  COMPONENTS = 'components',
  INTERCEPTOR = 'interceptors',
  ENTRY_COMPONENT = 'entryComponent'
}

export const getPropertyKey = (key: ModuleMetadata) => `${MODULE_METADATA_KEY_PREFIX}:${key}`
