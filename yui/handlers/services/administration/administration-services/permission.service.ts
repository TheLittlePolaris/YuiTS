import type { GuildMember } from 'discord.js';
import {
  AdminCommands,
  ADMIN_ACTION_TYPE
} from '../admin-interfaces/administration.interface';

export function memberHasPermission(
  member: GuildMember,
  action: string
): Promise<boolean> {
  return new Promise((resolve, _) => {
    if (!action || !AdminCommands.includes(action)) resolve(false);
    let clientPermission;
    switch (action as ADMIN_ACTION_TYPE) {
      case 'kick':
        clientPermission = member.hasPermission(
          ['KICK_MEMBERS'],
          false,
          true,
          true
        );
        break;
      case 'ban':
        clientPermission = member.hasPermission(
          ['BAN_MEMBERS'],
          false,
          true,
          true
        );
        break;
      case 'addrole':
      case 'removerole':
        clientPermission = member.hasPermission(
          ['MANAGE_ROLES'],
          false,
          true,
          true
        );
      case 'mute':
      case 'unmute':
        clientPermission = member.hasPermission(
          ['MUTE_MEMBERS'],
          false,
          true,
          true
        );
        break;
    }
    return resolve(clientPermission);
  });
}

export function yuiHasPermission(
  yui: GuildMember,
  action: string
): Promise<boolean> {
  return new Promise((resolve, _) => {
    if (!action || !AdminCommands.includes(action)) resolve(false);
    let yuiPermission;
    switch (action as ADMIN_ACTION_TYPE | 'say') {
      case 'say':
        yuiPermission = yui.hasPermission(
          ['MANAGE_MESSAGES'],
          false,
          true,
          true
        );
        break;
      case 'kick':
        yuiPermission = yui.hasPermission(['KICK_MEMBERS'], false, true, true);
        break;
      case 'ban':
        yuiPermission = yui.hasPermission(['BAN_MEMBERS'], false, true, true);
        break;
      case 'addrole':
      case 'removerole':
        yuiPermission = yui.hasPermission(['MANAGE_ROLES'], false, true, true);
      case 'mute':
      case 'unmute':
        yuiPermission = yui.hasPermission(['MUTE_MEMBERS'], false, true, true);
        break;
    }
    return resolve(yuiPermission);
  });
}
