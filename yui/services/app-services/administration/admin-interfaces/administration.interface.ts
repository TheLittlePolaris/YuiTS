import { Message, Permissions } from 'discord.js'

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
  [AdminAction.KICK]: [Permissions.FLAGS.KICK_MEMBERS],
  [AdminAction.BAN]: [Permissions.FLAGS.BAN_MEMBERS],
  [AdminAction.MUTE]: [Permissions.FLAGS.MUTE_MEMBERS],
  [AdminAction.UNMUTE]: [Permissions.FLAGS.MUTE_MEMBERS],
  [AdminAction.ADD_ROLE]: [Permissions.FLAGS.MANAGE_ROLES],
  [AdminAction.REMOVE_ROLE]: [Permissions.FLAGS.MANAGE_ROLES],
  [AdminAction.SET_NICKNAME]: [Permissions.FLAGS.MANAGE_NICKNAMES]
}

export type IAdminAction = {
  [key in keyof typeof AdminActionPermission]: (
    message: Message,
    args: string[],
    ...otherArgs
  ) => Promise<any>
}
