export type REACTION_KEY = '1️⃣' | '2️⃣' | '3️⃣' | '4️⃣'
// | '5️⃣'
// | '6️⃣'
// | '7️⃣'
// | '8️⃣'
// | '9️⃣'
// | '🔟'
export interface REACTION_DATA {
  icon: string
  name: string
  code: string
}

export const holoStatList: Record<string, REACTION_DATA> = {
  jp: {
    icon: '1️⃣',
    name: 'Japan',
    code: 'jp',
  },
  id: {
    icon: '2️⃣',
    name: 'Indonesia',
    code: 'id',
  },
  en: {
    icon: '4️⃣',
    name: 'English',
    code: 'en',
  },
}

export const holoStatRegionSubCommand = [
  'jp',
  'japan',
  'id',
  'china',
  'en',
  'english',
]
export const defaultDetailSubCommand = ['detail', 'd']

export type HOLOSTAT_PARAMS =
  | 'jp'
  | 'japan'
  | 'id'
  | 'indonesia'
  | 'detail'
  | 'd'
  | 'english'
  | 'en'

export enum HOLO_REGION_MAP {
  jp = 'Japan',
  id = 'Indonesia',
  en = 'English',
}
export type HOLO_KNOWN_REGION = keyof typeof HOLO_REGION_MAP
