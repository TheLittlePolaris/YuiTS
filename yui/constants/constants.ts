/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

export enum Constants {
  YUI_COLOR_CODE = 'FFA000',
  NOW_PLAYING_YUI = 'https://media.discordapp.net/attachments/413313406993694728/525196421553455114/Yui_Loading_5.gif',
}

export type TFunction = new (...args: any[]) => {}

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

/** ================================= HOLO STAT ======================================== */

export const holoStatRegionSubCommand = [
  'jp',
  'japan',
  'id',
  'indonesia',
  'cn',
  'china',
]

export const holoStatDetailSubCommand = ['detail', 'd']

export type DISCORD_REACTIONS_TYPE = '1️⃣' | '2️⃣' | '3️⃣' // currently just have 3
// | '4️⃣'
// | '5️⃣'
// | '6️⃣'
// | '7️⃣'
// | '8️⃣'
// | '9️⃣'
// | '🔟'
export type HOLOSTAT_PARAMS =
  | 'jp'
  | 'japan'
  | 'id'
  | 'indonesia'
  | 'china'
  | 'cn'
  | 'detail'
  | 'd'

export type HOLOSTAT_KNOWN_REGION_CODE = 'jp' | 'id' | 'cn'

export type HOLOSTAT_REACTION = {
  [key: string]: { name: string; code: HOLOSTAT_KNOWN_REGION_CODE }
}

export const DISCORD_REACTION = {
  NUMBERS: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
  FORWARD: '▶',
  BACKWARD: '◀',
}

export const holoStatReactionList: HOLOSTAT_REACTION = {
  '1️⃣': {
    name: 'Japan',
    code: 'jp',
  },
  '2️⃣': {
    name: 'Indonesia',
    code: 'id',
  },
  '3️⃣': {
    name: 'China',
    code: 'cn',
  },
}

export enum HOLO_REGION_MAP {
  cn = 'China',
  jp = 'Japan',
  id = 'Indonesia',
}
/** ==================================================================================== */

// export const holoProxyHandler = {
//   get: function (target: object, name: DISCORD_REACTIONS_TYPE) {
//     return target.hasOwnProperty(name)
//       ? target[name]
//       : HOLOLIVE_REACTION_LIST[DISCORD_REACTION.NUMBERS[0]]
//   },
// }
