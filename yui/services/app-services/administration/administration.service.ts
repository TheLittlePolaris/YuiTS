import { Message, MessageEmbed } from 'discord.js'
import { ADMIN_ACTION_TYPE } from './admin-interfaces/administration.interface'
import { AdminCommandComponent } from './administration-actions/admin-action-command.service'
import {
  AdminCommand,
  CommandValidator,
  AdminPermissionValidator,
} from '@/ioc-container/decorators/permission.decorator'
import { LOG_SCOPE } from '@/constants/constants'
import { YuiLogger } from '@/services/logger/logger.service'
import { Injectable } from '@/ioc-container/decorators/injections.decorators'
import { ConfigService } from '@/config-service/config.service'
import { YuiClient } from '@/custom-classes/yui-client'

@Injectable()
export class AdministrationService {
  constructor(private adminCommands: AdminCommandComponent, public configService: ConfigService, public yui: YuiClient) {
    YuiLogger.info(`Created!`, LOG_SCOPE.ADMIN_SERVICE)
  }

  @CommandValidator()
  @AdminPermissionValidator()
  public async executeCommand(
    message: Message,
    args: Array<string>,
    @AdminCommand() command?: ADMIN_ACTION_TYPE
  ) {
    this.adminCommands[command](message, args)
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
