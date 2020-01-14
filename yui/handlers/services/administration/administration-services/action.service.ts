import { ADMIN_ACTION_TYPE } from '../admin-interfaces/administration.interface';
import { GuildMember, Message, Role } from 'discord.js';
import { errorLogger } from '@/handlers/error.handler';

export function executeCommand(
  command: ADMIN_ACTION_TYPE,
  member: GuildMember,
  message: Message,
  _arguments: Array<string>
): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    switch (command) {
      case 'kick': {
        const reason =
          (_arguments && _arguments.length && _arguments.join(' ')) || null;
        const result = await kick(member, reason);
        result
          ? message.channel.send(
              `\`${member.user.username}\` has been kicked by \`${
                message.member.displayName
              }\`${reason ? ` for reason ${reason}` : ``}`
            )
          : message.author.send(`Unable to kick the member.`);
        return result;
      }
      case 'ban': {
        const reason =
          (_arguments && _arguments.length && _arguments.join(' ')) || null;
        const result = await ban(member, reason);
        result
          ? message.channel.send(
              `\`${member.user.username}\` has been banned by \`${
                message.member.displayName
              }\`${reason ? ` for reason ${reason}` : ``}`
            )
          : message.author.send(`Unable to ban the member.`);
        return result;
      }
      case 'mute': {
        const reason = (_arguments && _arguments.join('')) || '';
        const result = await mute(member, reason);
        result
          ? message.channel.send(
              `\`${member.user.username}\` has been mute by \`${
                message.member.displayName
              }\`${reason ? ` for reason ${reason}` : ``}`
            )
          : message.author.send(`Unable to mute the member.`);

        return result;
      }
      case 'unmute': {
        const reason = (_arguments && _arguments.join('')) || null;
        const result = await unmute(member, reason);
        result
          ? message.channel.send(
              `\`${member.user.username}\` has been unmute by \`${
                message.member.displayName
              }\`${reason ? ` for reason ${reason}` : ``}`
            )
          : message.author.send(`Unable to unmute the member.`);

        return result;
      }
      case 'addrole': {
        if (!_arguments || !_arguments.length) return resolve(false);
        const [role, reason] = [_arguments.shift(), _arguments.join(' ')];
        const serverRole = message.guild.roles.find('name', role);
        if (!role || !serverRole) {
          message.channel.send(`Role \`${role}\` does not exists.`);
          return Promise.resolve(false);
        }
        const result = await addRole(member, serverRole.name, reason);
        result
          ? message.channel.send(
              `Added role \`${serverRole.name}\` to ${member.displayName}`
            )
          : message.author.send(`Unable to add role to the member.`);
        return result;
      }
      case 'removerole': {
        if (!_arguments || !_arguments.length) return resolve(false);
        const [role, reason] = [_arguments.shift(), _arguments.join(' ')];
        const serverRole = message.guild.roles.find('name', role);
        if (!role || !serverRole) {
          message.channel.send(`Role \`${role}\` does not exists.`);
          return Promise.resolve(false);
        }
        const result = await removeRole(member, serverRole.name, reason);
        result
          ? message.channel.send(
              `Removed role \`${serverRole.name}\` from ${member.displayName}`
            )
          : message.author.send(`Unable to remove role from the member.`);
        return result;
      }
      case 'setnickname': {
        if (!_arguments || !_arguments.length) return resolve(false);
        const oldNickname = member.displayName || member.user.username;
        const nickname = _arguments.join(' ');
        const result = await setNickname(member, nickname);
        result
          ? message.channel.send(
              `\`${oldNickname}'s\` nickname has been set to \`${nickname}\` by ${message.member.displayName}`
            )
          : message.author.send(`Unable to set the member's nickname.`);
        return result;
      }
    }
  });
}

function kick(member: GuildMember, reason?: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const kicked = await member.kick(reason).catch(handleError);
    if (!kicked) return resolve(false);
    return resolve(!!kicked);
  });
}

function ban(member: GuildMember, reason?: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const banned = await member.ban(reason).catch(handleError);
    if (!banned) return resolve(false);
    return resolve(!!banned);
  });
}
function addRole(
  member: GuildMember,
  role: Role | string,
  reason?: string
): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const roleAdded = await member.addRole(role, reason).catch(handleError);
    if (!roleAdded) return resolve(false);
    return resolve(!!roleAdded);
  });
}
function removeRole(
  member: GuildMember,
  role: Role | string,
  reason?: string
): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const roleRemoved = await member
      .removeRole(role, reason)
      .catch(handleError);
    if (!roleRemoved) return resolve(false);
    return resolve(!!roleRemoved);
  });
}
function mute(member: GuildMember, reason?: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const muted = await member.setMute(true, reason).catch(handleError);
    if (!muted) return resolve(false);
    return resolve(!!muted);
  });
}
function unmute(member: GuildMember, reason?: string): Promise<boolean> {
  return new Promise<boolean>(async (resolve, _) => {
    const unmuted = await member.setMute(false, reason).catch(handleError);
    if (!unmuted) return resolve(false);
    return resolve(!!unmuted);
  });
}

function setNickname(
  member: GuildMember,
  nickname: string,
  reason?: string
): Promise<boolean> {
  return new Promise((resolve, _) => {
    const nicknameSet = member.setNickname(nickname).catch(null);
    if (!nickname) resolve(false);
    return resolve(!!nicknameSet);
  });
}

function handleError(error: Error | string): null {
  return errorLogger(error, 'ADMIN_ACTION_SERVICE');
}
