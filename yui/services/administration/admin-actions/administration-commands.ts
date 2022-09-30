/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Channel } from 'diagnostics_channel';

import {
  GuildMember,
  Message,
  Role,
  MessagePayload,
  MessageOptions,
  TextChannel
} from 'discord.js';
import { Injectable } from 'djs-ioc-container';

import { IAdminAction } from '../admin-interfaces';
import { AdminAction, CmdExecutor, Targets, Reason, MentionedRoles, Nickname } from '../decorators';

import { YuiLogger } from '@/logger/logger.service';
import { sendMessageToChannel } from '@/services/utilities';

@Injectable()
export class AdministrationCommands implements IAdminAction {
  @AdminAction()
  async kick(
    message: Message,
    arguments_: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const kicks = await Promise.all([targets.map(async (target) => target.kick())]).catch((error) =>
      this.handleError(new Error(error))
    );

    const content = `\`${targets.map((t) => t.user.username).join(', ')}\` has been kicked by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ''}`;

    if (kicks.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to kick the member(s).');
  }

  @AdminAction()
  async ban(
    message: Message,
    arguments_: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const bans = await Promise.all([targets.map(async (target) => target.ban({ reason }))]).catch(
      (error) => this.handleError(new Error(error))
    );
    const content = `\`${targets.map((t) => t.user.username).join(', ')}\` has been banned by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ''}`;
    if (bans.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to ban the member(s).');
  }

  @AdminAction()
  async addrole(
    message: Message,
    arguments_: Array<string>,
    @Targets() targets: GuildMember[],
    @Reason() reason: string,
    @MentionedRoles() roles: Role[]
  ) {
    const addedRoles = await Promise.all(
      targets.map(async (target) =>
        target.roles.add(roles, reason).catch((error) => this.handleError(new Error(error)))
      )
    ).catch((error) => this.handleError(new Error(error)));
    const roleNames = roles.map((role) => role.name);
    const content = `Added role \`${roleNames.join(', ')}\` to ${targets
      .map((t) => t.displayName)
      .join(', ')}${reason ? ` for reason ${reason}` : ''}`;
    if (addedRoles.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to add role to the member.');
  }

  @AdminAction()
  async removerole(
    message: Message,
    arguments_: Array<string>,
    @Targets() targets: GuildMember[],
    @Reason() reason: string,
    @MentionedRoles() roles: Role[]
  ) {
    const removedRoles = await Promise.all(
      targets.map(async (target) =>
        target.roles.remove(roles, reason).catch((error) => this.handleError(new Error(error)))
      )
    ).catch((error) => this.handleError(new Error(error)));

    const roleNames = roles.map((role) => role.name);

    const content = `Removed role \`${roleNames.join(', ')}\` from ${targets
      .map((t) => t.displayName)
      .join(', ')}${reason ? ` for reason ${reason}` : ''}`;
    if (removedRoles.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to add role to the member.');
  }

  @AdminAction()
  async mute(
    message: Message,
    arguments_: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const muted = await Promise.all([
      targets.map(async (target) =>
        target.voice.setMute(true, reason).catch((error) => this.handleError(new Error(error)))
      )
    ]).catch((error) => this.handleError(new Error(error)));

    const content = `\`${targets.map((t) => t.displayName).join(', ')}\` has been muted by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ''}`;

    if (muted.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to mute the member.');
  }

  @AdminAction()
  async unmute(
    message: Message,
    arguments_: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const unmuted = await Promise.all([
      targets.map(async (target) =>
        target.voice.setMute(false, reason).catch((error) => this.handleError(new Error(error)))
      )
    ]).catch((error) => this.handleError(new Error(error)));

    const content = `\`${targets.map((t) => t.displayName).join(', ')}\` has been unmuted by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ''}`;

    if (unmuted.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', 'Unable to unmute the member.');

    return;
  }

  @AdminAction()
  async setnickname(
    message: Message,
    arguments_: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Nickname() nickname: string
  ) {
    const setnickname = await Promise.all([
      targets.map(async (target) =>
        target.setNickname(nickname).catch((error) => this.handleError(new Error(error)))
      )
    ]).catch((error) => this.handleError(new Error(error)));

    const content = `\`${targets[0].user.username}'s ${
      targets.length > 1 ? `and ${targets.length - 1} others` : ''
    }\` nickname has been set to \`${nickname}\` by ${executor.displayName}`;

    if (setnickname.length) this.sendMessage(message, 'channel', content);
    else this.sendMessage(message, 'author', "Unable to set the member's nickname.");

    return;
  }

  private async sendMessage(
    message: Message,
    type: 'channel' | 'author',
    content: string | MessagePayload | MessageOptions
  ) {
    return sendMessageToChannel(message[type] as TextChannel, content);
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name);
    return null;
  }
}
