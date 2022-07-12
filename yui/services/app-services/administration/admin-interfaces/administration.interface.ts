import { Message } from 'discord.js'

export enum AdminAction {
  Kick = 'kick',
  Ban = 'ban',
  Mute = 'mute',
  Unmute = 'unmute',
  SetNickname = 'setnickname',
  AddRole = 'addrole',
  RemoveRole = 'removerole'
}
export type ADMIN_ACTION_TYPE =
  | 'kick'
  | 'ban'
  | 'mute'
  | 'unmute'
  | 'setnickname'
  | 'addrole'
  | 'removerole'

export const ADMIN_COMMANDS = [
  'kick',
  'ban',
  'mute',
  'unmute',
  'setnickname',
  'addrole',
  'removerole'
]

export interface IAdminAction {
  [AdminAction.Kick]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.Ban]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.Mute]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.Unmute]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.SetNickname]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.AddRole]: (message: Message, args: string[], ...otherArgs) => Promise<any>
  [AdminAction.RemoveRole]: (message: Message, args: string[], ...otherArgs) => Promise<any>
}
