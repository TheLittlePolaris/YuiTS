import { YuiClient } from '@/custom-classes/yui-client'
import { YuiLogger } from '@/log/logger.service'

export class EntryPointComponent {
  private _bot: YuiClient
  private _token: string
  constructor(yui: YuiClient, token: string) {
    this._bot = yui
    this._token = token
  }

  public async start() {
    YuiLogger.log('Connecting... 📡', EntryPointComponent.name)
    return this._bot.login(this._token)
  }

  public get token() {
    return this._token
  }

  public get client() {
    return this._bot
  }
}
