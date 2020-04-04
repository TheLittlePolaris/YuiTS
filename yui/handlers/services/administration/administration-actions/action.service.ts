import { GuildMember, Message, Role } from 'discord.js'
import { errorLogger, debugLogger } from '@/handlers/log.handler'
import {
  Targets,
  Reason,
  ValidateCommand,
  GuildRoles,
  NickName,
  Executor,
} from '@/decorators/permission.decorator'
import { LOG_SCOPE } from '@/constants/constants'

export class AdminstrationActionCommands {
  constructor() {
    debugLogger(LOG_SCOPE.ADMIN_ACTION_COMMAND)
  }

  @ValidateCommand()
  async kick(
    message: Message,
    args: Array<string>,
    @Executor() executor?: GuildMember,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string
  ) {
    const kicks = await Promise.all([
      targets.map((target) => target.kick()),
    ]).catch(this.handleError)

    !!kicks.length
      ? message.channel.send(
          `\`${targets[0].user.username}${
            targets.length > 1 ? ` and ${targets.length - 1} others` : ``
          }\` has been kicked by \`${executor.displayName}\`${
            reason ? ` for reason ${reason}` : ``
          }`
        )
      : message.author.send(`Unable to kick the member.`)

    return
  }

  @ValidateCommand()
  async ban(
    message: Message,
    args: Array<string>,
    @Executor() executor?: GuildMember,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string
  ) {
    const bans = await Promise.all([
      targets.map((target) => target.ban(reason)),
    ]).catch(this.handleError)

    !!bans.length
      ? message.channel.send(
          `\`${targets[0].user.username}${
            targets.length > 1 ? ` and ${targets.length - 1} others` : ``
          }\` has been banned by \`${executor.displayName}\`${
            reason ? ` for reason ${reason}` : ``
          }`
        )
      : message.author.send(`Unable to ban the member.`)
    return
  }

  @ValidateCommand()
  async addrole(
    message: Message,
    args: Array<string>,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string,
    @GuildRoles() roles?: Role[]
  ) {
    const addedRole = await Promise.all(
      targets.map((target) =>
        target
          .addRoles(roles, reason)
          .catch((err) => this.handleError(new Error(err)))
      )
    ).catch((error) => this.handleError(new Error(error)))

    const roleNames = roles.map((role) => role.name)

    !!addedRole.length
      ? message.channel.send(
          `Added role \`${
            roleNames.length > 1 ? roleNames.join(', ') : roleNames[0]
          }\` to ${targets[0].displayName} ${
            targets.length > 1 ? `and ${targets.length - 1} others` : ``
          }${reason ? ` for reason ${reason}` : ``}`
        )
      : message.author.send(`Unable to add role to the member.`)
    return
  }

  @ValidateCommand()
  async removerole(
    message: Message,
    args: Array<string>,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string,
    @GuildRoles() roles?: Role[]
  ) {
    const removedRoles = await Promise.all(
      targets.map((target) =>
        target
          .removeRoles(roles, reason)
          .catch((err) => this.handleError(new Error(err)))
      )
    ).catch(this.handleError)

    const roleNames = roles.map((role) => role.name)

    !!(removedRoles && removedRoles.length)
      ? message.channel.send(
          `Removed role \`${
            roleNames.length > 1 ? roleNames.join(', ') : roleNames[0]
          }\` from ${targets[0].displayName} ${
            targets.length > 1 ? `and ${targets.length - 1} others` : ``
          }`
        )
      : message.author.send(`Unable to remove role from the member.`)

    return
  }

  @ValidateCommand()
  async mute(
    message: Message,
    args: Array<string>,
    @Executor() executor?: GuildMember,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string
  ) {
    const muted = await Promise.all([
      targets.map((target) => target.setMute(true, reason)),
    ]).catch(this.handleError)
    !!muted.length
      ? message.channel.send(
          `\`${targets[0].displayName} ${
            targets.length > 1 ? `and ${targets.length - 1} others` : ``
          }\` has been unmuted by \`${executor.displayName}\`${
            reason ? ` for reason ${reason}` : ``
          }`
        )
      : message.author.send(`Unable to mute the member.`)

    return
  }

  @ValidateCommand()
  async unmute(
    message: Message,
    args: Array<string>,
    @Executor() executor?: GuildMember,
    @Targets() targets?: GuildMember[],
    @Reason() reason?: string
  ) {
    const unmuted = await Promise.all([
      targets.map((target) => target.setMute(false, reason)),
    ]).catch(this.handleError)
    !!unmuted.length
      ? message.channel.send(
          `\`${targets[0].displayName} ${
            targets.length > 1 ? `and ${targets.length - 1} others` : ``
          }\` has been unmuted by \`${executor.displayName}\`${
            reason ? ` for reason ${reason}` : ``
          }`
        )
      : message.author.send(`Unable to unmute the member.`)

    return
  }

  @ValidateCommand()
  async setnickname(
    message: Message,
    args: Array<string>,
    @Executor() executor?: GuildMember,
    @Targets() targets?: GuildMember[],
    @NickName() nickname?: string
  ) {
    // return await member.setNickname(nickname).catch(null)
    const setnickname = await Promise.all([
      targets.map((target) => target.setNickname(nickname)),
    ]).catch(this.handleError)
    !!setnickname.length
      ? message.channel.send(
          `\`${targets[0].user.username}'s ${
            targets.length > 1 ? `and ${targets.length - 1} others` : ``
          }\` nickname has been set to \`${nickname}\` by ${
            executor.displayName
          }`
        )
      : message.author.send(`Unable to set the member's nickname.`)

    return
  }

  handleError(error: Error | string): null {
    return errorLogger(error, 'ADMIN_ACTION_SERVICE')
  }
}
