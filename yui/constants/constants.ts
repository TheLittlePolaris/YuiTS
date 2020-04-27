import { Message } from 'discord.js'

export enum Constants {
  YUI_COLOR_CODE = 'FFA000',
  NOW_PLAYING_YUI = 'https://media.discordapp.net/attachments/413313406993694728/525196421553455114/Yui_Loading_5.gif',
}

export type TFunction = new (...args: any[]) => {}

export type AcessControllerFn = (message: Message, join: boolean) => void

export enum CONSTANTS {
  MUSIC_STREAMS = 'music-streams',
}

export enum LOG_SCOPE {
  YUI_MAIN = 'YuiMain',
  YUI_CORE = 'YuiCore',
  MESSAGE_HANDLER = 'MessageHandler',
  VOICE_STATE_HANDLER = 'VoiceStateHandler',
  MUSIC_SERVICE = 'MusicService',
  FEATURE_SERVICE = 'FeatureService',
  ADMIN_SERVICE = 'AdministrationService',
  CONFIG_SERVICE = 'ConfigService',
  REQUEST_SERVIE = 'RequestService',
  DECORATOR = 'Decorator',
  ADMIN_ACTION_COMMAND = 'AdminActionCommand',
  HOLOSTAT_SERVICE = 'HolostatService',
  HOLOSTAT_REQUEST_SERVICE = 'HolostatRequestService',
}

export const HOLOSTAT_SUB_COMMANDS = [
  'jp',
  'japan',
  'id',
  'indonesia',
  'detail',
]

export type HOLOSTAT_REGION = 'jp' | 'japan' | 'id' | 'indonesia' | 'detail' //exception

export const DISCORD_REACTION = {
  NUMBERS: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
  FORWARD: '▶',
  BACKWARD: '◀',
}

export const hololiveReactionList = {
  '1️⃣': {
    name: 'Japan',
    code: 'jp',
  },
  '2️⃣': {
    name: 'Indonesia',
    code: 'id',
  },
}
