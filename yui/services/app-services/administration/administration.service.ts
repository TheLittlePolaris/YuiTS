import { Message, MessageEmbed } from 'discord.js'
import { ADMIN_ACTION_TYPE } from './admin-interfaces/administration.interface'
import { AdminCommandComponent } from './administration-actions/admin-action-command.service'
import {
  AdminCommand,
  CommandValidator,
  AdminPermissionValidator,
  DiscordClient,
  Injectable,
} from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'
import { ConfigService } from '@/config-service/config.service'

@Injectable()
export class AdministrationService {
  constructor(
    private adminCommands: AdminCommandComponent,
    public configService: ConfigService,
    public yui: DiscordClient
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
