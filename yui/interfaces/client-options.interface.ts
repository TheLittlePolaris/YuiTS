export interface ClientOptions {
  disableEveryone: boolean;
  disabledEvents: Array<WSEvents>;
}
// 'TYPING_START', 'MESSAGE_REACTION_ADD', 'RELATIONSHIP_ADD', 'RELATIONSHIP_REMOVE', 'MESSAGE_REACTION_REMOVE'
export enum WSEvents {
  READY = "READY",
  RESUMED = "RESUMED",
  GUILD_SYNC = "GUILD_SYNC",
  GUILD_CREATE = "GUILD_CREATE",
  GUILD_DELETE = "GUILD_DELETE",
  GUILD_UPDATE = "GUILD_UPDATE",
  GUILD_MEMBER_ADD = "GUILD_MEMBER_ADD",
  GUILD_MEMBER_REMOVE = "GUIILD_MEMBER_REMOVE",
  GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
  GUILD_MEMBERS_CHUNK = "GUILD_MEMBERS_CHUNK",
  GUILD_INTEGRATIONS_UPDATE = "GUILD_INTEGRATIONS_UPDATE",
  GUILD_ROLE_CREATE = "GUILD_ROLE_CREATE",
  GUILD_ROLE_DELETE = "GUILD_ROLE_DELETE",
  GUILD_ROLE_UPDATE = "GUILD_ROLE_UPDATE",
  GUILD_BAN_ADD = "GUILD_BAN_ADD",
  GUILD_BAN_REMOVE = "GUILD_BAN_REMOVE",
  CHANNEL_CREATE = "CHANNEL_CREATE",
  CHANNEL_DELETE = "CHANNEL_DELETE",
  CHANNEL_UPDATE = "CHANNEL_UPDATE",
  CHANNEL_PINS_UPDATE = "CHANNEL_PINS_UPDATE",
  MESSAGE_CREATE = "MESSAGE_CREATE",
  MESSAGE_DELETE = "MESSAGE_DELETE",
  MESSAGE_UPDATE = "MESSAGE_UPDATE",
  MESSAGE_DELETE_BULK = "MESSAGE_DELETE_BULK",
  MESSAGE_REACTION_ADD = "MESSAGE_REACTION_ADD",
  MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",
  MESSAGE_REACTION_REMOVE_ALL = "MESSAGE_REACTION_REMOVE_ALL",
  USER_UPDATE = "USER_UPDATE",
  USER_NOTE_UPDATE = "USER_NOTE_UPDATE",
  USER_SETTINGS_UPDATE = "USER_SETTINGS_UPDATE",
  PRESENCE_UPDATE = "PRESENCE_UPDATE",
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  TYPING_START = "TYPING_START",
  VOICE_SERVER_UPDATE = "VOICE_SERVER_UPDATE",
  RELATIONSHIP_ADD = "RELATIONSHIP_ADD",
  RELATIONSHIP_REMOVE = "RELATIONSHIP_REMOVE",
  WEBHOOKS_UPDATE = "WEBHOOKS_UPDATE"
}
