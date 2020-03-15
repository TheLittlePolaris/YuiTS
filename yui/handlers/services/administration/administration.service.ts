import { debugLogger, errorLogger } from '@/handlers/error.handler'
import { Message, RichEmbed } from 'discord.js'
import { isMyOwner } from '../feature/feature-services/utility.service'
import {
  memberHasPermission,
  yuiHasPermission
} from './administration-services/permission.service'
import {
  ADMIN_ACTION_TYPE,
  AdminCommands
} from './admin-interfaces/administration.interface'
import { executeCommand } from './administration-services/action.service'

export class AdministrationService {
  constructor() {
    debugLogger('AdministrationService')
  }

  public async execAdminCommand(
    message: Message,
    args: Array<string>
  ): Promise<void> {
    if (!args.length) {
      this.sendMessage(
        message,
        `**You must specify which action to be executed.**`
      )
    }
    const subCommand: ADMIN_ACTION_TYPE = (AdminCommands.includes(args[0]) &&
      args[0]) as ADMIN_ACTION_TYPE
    if (!subCommand) {
      this.sendMessage(
        message,
        `**You must specify which action to be executed.**`
      )
      return Promise.resolve()
    }
    const yui = message.guild.members.get(global?.config?.yuiId)
    const yuiPermission = await yuiHasPermission(yui, subCommand)
    const memberPermission = await memberHasPermission(
      message.member,
      subCommand
    )
    if (!memberPermission && !isMyOwner(message.author.id)) {
      {
        this.sendMessage(
          message,
          '**You are not authorized to use this command.**'
        )
        return Promise.resolve()
      }
    }
    if (!yuiPermission) {
      {
        this.sendMessage(
          message,
          `**I don't have anough permission to execute this command.**`
        )
        return Promise.resolve()
      }
    }
    const targetMember = message.mentions.members.first()
    if (!targetMember) {
      this.sendMessage(message, '**Please specify a member for the action.**')
      return Promise.resolve()
    }
    const testFormat = args.shift()
    if (!testFormat || String(testFormat) !== targetMember.toString()) {
      this.sendMessage(
        message,
        `**Wrong format, please take a look at \`>help\` and then try again.**`
      )
      return Promise.resolve()
    }
    await executeCommand(subCommand, targetMember, message, args) // TODO: test this
    return Promise.resolve()
  }

  public sendMessage(
    message: Message,
    content: string | RichEmbed
  ): Promise<Message | Message[]> {
    return message.author.send(content).catch(this.handleError)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, 'ADMINISTRATION_SERVICE')
  }
}
