import { Message, MessageEmbed } from 'discord.js'
import { ADMIN_ACTION_TYPE } from './admin-interfaces/administration.interface'
import { AdminstrationActionCommands } from './administration-actions/admin-action-command.service'
import {
  Command,
  CommandValidator,
  AdminPermissionValidator,
} from '@/decorators/permission.decorator'
import { LOG_SCOPE } from '@/constants/constants'
import { YuiLogger } from '@/log/logger.service'
import { Injectable } from '@/dep-injection-ioc/decorators'

@Injectable()
export class AdministrationService {
  constructor(private _adminActionCommands: AdminstrationActionCommands) {
    YuiLogger.info(`Created!`, LOG_SCOPE.ADMIN_SERVICE)
  }

  @CommandValidator()
  @AdminPermissionValidator()
  public async executeCommand(
    message: Message,
    args: Array<string>,
    @Command() command?: ADMIN_ACTION_TYPE
  ) {
    this._adminActionCommands[command](message, args)
  }

  public sendMessage(
    message: Message,
    content: string | MessageEmbed
  ): Promise<Message | Message[]> {
    return message.author.send(content).catch((err) => this.handleError(new Error(err)))
  }

  private handleError(error: Error | string): null {
    YuiLogger.error(error, LOG_SCOPE.ADMIN_SERVICE)
    return null
  }
}
