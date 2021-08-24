import { Message, MessageEmbed } from 'discord.js'
import { ADMIN_ACTION_TYPE } from './admin-interfaces/administration.interface'
import { AdminCommandComponent } from './administration-actions/admin-action-command.service'
import {

  DiscordClient,
  Injectable,
} from '@/ioc-container'
import { ConfigService } from '@/config-service/config.service'
import { AdminCommand, AdminPermissionValidator, CommandValidator } from '@/custom/decorators/permission.decorator'

@Injectable()
export class AdministrationService {
  constructor(
    private adminCommands: AdminCommandComponent,
  ) {}

  public async executeCommand(message: Message, args: string[], ..._args)
  @CommandValidator()
  @AdminPermissionValidator()
  public async executeCommand(
    message: Message,
    args: Array<string>,
    @AdminCommand() command: ADMIN_ACTION_TYPE
  ) {
    this.adminCommands[command](message, args)
  }
}
