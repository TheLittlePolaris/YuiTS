import { Message } from 'discord.js'
import { Inject, Injectable } from 'djs-ioc-container'
import { AdminAction, IAdminAction } from './admin-interfaces/administration.interface'
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants'
import {
  AdminCommand,
  AdminCommandArgs,
  AdminPermissionValidator,
  CommandValidator
} from './decorators'

@Injectable()
export class AdministrationService {
  constructor(@Inject(ADMIN_ACTION_PROVIDER) private readonly adminCommands: IAdminAction) {}

  @CommandValidator()
  @AdminPermissionValidator()
  async executeAdminAction(
    message: Message,
    args: string[],
    @AdminCommand() command?: AdminAction,
    @AdminCommandArgs() adminArgs?: string[]
  ) {
    this.adminCommands[command](message, adminArgs)
  }
}
