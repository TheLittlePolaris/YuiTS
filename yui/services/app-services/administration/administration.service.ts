import { Message } from 'discord.js'
import { AdminAction, IAdminAction } from './admin-interfaces/administration.interface'
import { Inject, Injectable } from 'djs-ioc-container'
import {
  AdminCommand,
  AdminPermissionValidator,
  CommandValidator
} from '@/custom/decorators/permission.decorator'
import { ADMIN_ACTION_PROVIDER } from './constants/adminisatration-commands.constants'

@Injectable()
export class AdministrationService {
  constructor(@Inject(ADMIN_ACTION_PROVIDER) private readonly _adminCommands: IAdminAction) {}

  async executeCommand(message: Message, args: string[], ..._args)
  @CommandValidator()
  @AdminPermissionValidator()
  async executeCommand(
    message: Message,
    args: Array<string>,
    @AdminCommand() command: AdminAction
  ) {
    this._adminCommands[command](message, args)
  }
}
