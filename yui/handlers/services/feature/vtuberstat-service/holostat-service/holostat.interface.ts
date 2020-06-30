export const holoStatRegionSubCommand = ['jp', 'japan', 'id', 'indonesia', 'cn', 'china']

export const holoStatDetailSubCommand = ['detail', 'd']

export type REACTION_KEY = '1️⃣' | '2️⃣' | '3️⃣' // currently just have 3
// | '4️⃣'
// | '5️⃣'
// | '6️⃣'
// | '7️⃣'
// | '8️⃣'
// | '9️⃣'
// | '🔟'
export type HOLOSTAT_PARAMS = 'jp' | 'japan' | 'id' | 'indonesia' | 'china' | 'cn' | 'detail' | 'd'

export interface REACTION_DATA {
  name: string
  code: string
}

export const holoStatReactionList: Record<REACTION_KEY, REACTION_DATA> = {
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

export type HOLO_KNOWN_REGION = keyof typeof HOLO_REGION_MAP
