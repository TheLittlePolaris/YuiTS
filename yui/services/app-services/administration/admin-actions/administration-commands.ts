/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GuildMember, Message, Role, MessagePayload, MessageOptions } from 'discord.js'
import { YuiLogger } from '@/services/logger/logger.service'
import {
  AdminCommandValidator,
  CmdExecutor,
  MentionedRoles,
  Nickname,
  Reason,
  Targets
} from '@/services/app-services/feature/decorators/admin-action.decorator'
import { Injectable } from '@/ioc-container'
import { IAdminAction } from '../admin-interfaces'

@Injectable()
export class AdministrationCommands implements IAdminAction {
  @AdminCommandValidator()
  async kick(
    message: Message,
    args: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const kicks = await Promise.all([targets.map((target) => target.kick())]).catch((err) =>
      this.handleError(new Error(err))
    )

    const content = `\`${targets.map((t) => t.user.username).join(', ')}\` has been kicked by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ``}`
    kicks.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to kick the member(s).`)
  }

  @AdminCommandValidator()
  async ban(
    message: Message,
    args: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const bans = await Promise.all([targets.map((target) => target.ban({ reason }))]).catch((err) =>
      this.handleError(new Error(err))
    )
    const content = `\`${targets.map((t) => t.user.username).join(', ')}\` has been banned by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ``}`
    bans.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to ban the member(s).`)
  }

  @AdminCommandValidator()
  async addrole(
    message: Message,
    args: Array<string>,
    @Targets() targets: GuildMember[],
    @Reason() reason: string,
    @MentionedRoles() roles: Role[]
  ) {
    const addedRoles = await Promise.all(
      targets.map((target) =>
        target.roles.add(roles, reason).catch((err) => this.handleError(new Error(err)))
      )
    ).catch((error) => this.handleError(new Error(error)))
    const roleNames = roles.map((role) => role.name)
    const content = `Added role \`${roleNames.join(', ')}\` to ${targets
      .map((t) => t.displayName)
      .join(', ')}${reason ? ` for reason ${reason}` : ``}`
    addedRoles.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to add role to the member.`)
  }

  @AdminCommandValidator()
  async removerole(
    message: Message,
    args: Array<string>,
    @Targets() targets: GuildMember[],
    @Reason() reason: string,
    @MentionedRoles() roles: Role[]
  ) {
    const removedRoles = await Promise.all(
      targets.map((target) =>
        target.roles.remove(roles, reason).catch((err) => this.handleError(new Error(err)))
      )
    ).catch((err) => this.handleError(new Error(err)))

    const roleNames = roles.map((role) => role.name)

    const content = `Removed role \`${roleNames.join(', ')}\` from ${targets
      .map((t) => t.displayName)
      .join(', ')}${reason ? ` for reason ${reason}` : ``}`
    removedRoles.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to add role to the member.`)
  }

  @AdminCommandValidator()
  async mute(
    message: Message,
    args: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const muted = await Promise.all([
      targets.map((target) =>
        target.voice.setMute(true, reason).catch((err) => this.handleError(new Error(err)))
      )
    ]).catch((err) => this.handleError(new Error(err)))

    const content = `\`${targets.map((t) => t.displayName).join(', ')}\` has been muted by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ``}`

    muted.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to mute the member.`)
  }

  @AdminCommandValidator()
  async unmute(
    message: Message,
    args: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Reason() reason: string
  ) {
    const unmuted = await Promise.all([
      targets.map((target) =>
        target.voice.setMute(false, reason).catch((err) => this.handleError(new Error(err)))
      )
    ]).catch((err) => this.handleError(new Error(err)))

    const content = `\`${targets.map((t) => t.displayName).join(', ')}\` has been unmuted by \`${
      executor.displayName
    }\`${reason ? ` for reason ${reason}` : ``}`

    unmuted.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to unmute the member.`)

    return
  }

  @AdminCommandValidator()
  async setnickname(
    message: Message,
    args: Array<string>,
    @CmdExecutor() executor: GuildMember,
    @Targets() targets: GuildMember[],
    @Nickname() nickname: string
  ) {
    const setnickname = await Promise.all([
      targets.map((target) =>
        target.setNickname(nickname).catch((err) => this.handleError(new Error(err)))
      )
    ]).catch((err) => this.handleError(new Error(err)))

    const content = `\`${targets[0].user.username}'s ${
      targets.length > 1 ? `and ${targets.length - 1} others` : ``
    }\` nickname has been set to \`${nickname}\` by ${executor.displayName}`

    setnickname.length
      ? this.sendMessage(message, 'channel', content)
      : this.sendMessage(message, 'author', `Unable to set the member's nickname.`)

    return
  }

  private async sendMessage(
    message: Message,
    type: 'channel' | 'author',
    content: string | MessagePayload | MessageOptions
  ) {
    return await message[type].send(content as any).catch((err) => this.handleError(err))
  }

  handleError(error: Error | string): null {
    YuiLogger.error(error, this.constructor.name)
    return null
  }
}
