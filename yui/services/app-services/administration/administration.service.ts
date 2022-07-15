import { Message } from 'discord.js'
import { Inject, Injectable } from 'djs-ioc-container'
import { AdminAction, IAdminAction } from './admin-interfaces/administration.interface'
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants'
import {
  AdminCommand,
  AdminCommandArgs,
  AdminCommandValidator,
  AdminPermissionValidator
} from './decorators'

@Injectable()
export class AdministrationService {
  constructor(@Inject(ADMIN_ACTION_PROVIDER) private readonly _adminCommands: IAdminAction) {}

  @AdminCommandValidator()
  @AdminPermissionValidator()
  async executeAdminAction(
    message: Message,
    args: string[],
    @AdminCommand() command?: AdminAction,
    @AdminCommandArgs() adminArgs?: string[]
  ) {
    this._adminCommands[command](message, adminArgs)
  }
}
