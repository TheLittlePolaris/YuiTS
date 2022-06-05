export enum ADMIN_ACTION {
  KICK = 'kick',
  BAN = 'ban',
  MUTE = 'mute',
  UNMUTE = 'unmute',
  SET_NICKNAME = 'setnickname',
  ADD_ROLE = 'addrole',
  REMOVE_ROLE = 'removerole',
}
export type ADMIN_ACTION_TYPE = 'kick' | 'ban' | 'mute' | 'unmute' | 'setnickname' | 'addrole' | 'removerole'

export const ADMIN_COMMANDS = ['kick', 'ban', 'mute', 'unmute', 'setnickname', 'addrole', 'removerole']
