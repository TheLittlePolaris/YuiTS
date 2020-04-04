import { debugLogger, errorLogger } from '@/handlers/log.handler'
import { Message, RichEmbed } from 'discord.js'
import { ADMIN_ACTION_TYPE } from './admin-interfaces/administration.interface'
import { AdminstrationActionCommands } from './administration-actions/action.service'
import {
  Command,
  CommandExecutor,
  AdministrationServiceInitiator,
  ValidatePermissions,
} from '@/decorators/permission.decorator'
import { LOG_SCOPE } from '@/constants/constants'

@AdministrationServiceInitiator(() => AdminstrationActionCommands)
export class AdministrationService {
  public _adminActionCommands: AdminstrationActionCommands

  constructor() {
    debugLogger('AdministrationService')
  }

  @CommandExecutor()
  @ValidatePermissions()
  public async executeCommand(
    message: Message,
    args: Array<string>,
    @Command() command?: ADMIN_ACTION_TYPE
  ) {
    return await this._adminActionCommands[command](message, args)
  }

  public sendMessage(
    message: Message,
    content: string | RichEmbed
  ): Promise<Message | Message[]> {
    return message.author.send(content).catch(this.handleError)
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, LOG_SCOPE.ADMIN_SERVICE)
  }
}
