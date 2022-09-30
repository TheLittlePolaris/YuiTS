import { Message, PermissionFlagsBits, Permissions } from 'discord.js'

export enum AdminAction {
  KICK = 'kick',
  BAN = 'ban',
  MUTE = 'mute',
  UNMUTE = 'unmute',
  SET_NICKNAME = 'setnickname',
  ADD_ROLE = 'addrole',
  REMOVE_ROLE = 'removerole'
}

export const AdminActionPermission = {
  [AdminAction.KICK]: [PermissionFlagsBits.KickMembers],
  [AdminAction.BAN]: [PermissionFlagsBits.BanMembers],
  [AdminAction.MUTE]: [PermissionFlagsBits.MuteMembers],
  [AdminAction.UNMUTE]: [PermissionFlagsBits.MuteMembers],
  [AdminAction.ADD_ROLE]: [PermissionFlagsBits.ManageRoles],
  [AdminAction.REMOVE_ROLE]: [PermissionFlagsBits.ManageRoles],
  [AdminAction.SET_NICKNAME]: [PermissionFlagsBits.ManageNicknames]
}

export type IAdminAction = {
  [key in keyof typeof AdminActionPermission]: (
    message: Message,
    args: string[],
    ...otherArgs
  ) => Promise<any>
}
