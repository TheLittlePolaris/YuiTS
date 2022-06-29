import { uniqFlattenEntries } from '@/services/app-services/utilities'

export type REACTION_KEY = '1️⃣' | '2️⃣' | '3️⃣' | '4️⃣'
// | '5️⃣'
// | '6️⃣'
// | '7️⃣'
// | '8️⃣'
// | '9️⃣'
// | '🔟'
export interface IHoloStatReactionData {
  icon: string
  name: string
  code: string
}

export enum HoloStatRegions {
  Japan = 'jp',
  Indonesia = 'id',
  English = 'en'
}

export type KnownHoloStatRegions = `${HoloStatRegions}`

export const holoStatList: Record<HoloStatRegions, IHoloStatReactionData> = {
  [HoloStatRegions.Japan]: {
    icon: '1️⃣',
    name: 'Japan',
    code: 'jp'
  },
  [HoloStatRegions.Indonesia]: {
    icon: '2️⃣',
    name: 'Indonesia',
    code: 'id'
  },
  [HoloStatRegions.English]: {
    icon: '3️⃣',
    name: 'English',
    code: 'en'
  }
}

export enum HoloStatFunctionalCommands {
  Detail = 'd'
}

export type HoloStatParams =
  | Lowercase<keyof typeof HoloStatRegions>
  | Lowercase<KnownHoloStatRegions>
  | Lowercase<keyof typeof HoloStatFunctionalCommands>
  | Lowercase<`${HoloStatFunctionalCommands}`>

export const holoStatRegions = uniqFlattenEntries(HoloStatRegions)
export const holoStatFunctionalCommands = uniqFlattenEntries(HoloStatFunctionalCommands)

export const holoStatCommands = [...holoStatRegions, ...holoStatFunctionalCommands]
