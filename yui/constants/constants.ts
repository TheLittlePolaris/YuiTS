import { Message } from 'discord.js'

export enum Constants {
  YUI_COLOR_CODE = 'FFA000'
}

export type TFunction = new (...args: any[]) => {}

export type AcessControllerFn = (message: Message, join: boolean) => void

export enum CONSTANTS {
  MUSIC_STREAMS = 'music-streams'
}
