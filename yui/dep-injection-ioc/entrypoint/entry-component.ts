import { YuiClient } from '@/custom-classes/yui-client'
import { YuiLogger } from '@/log/logger.service'

export class EntryComponent {
  private _yui: YuiClient
  private _token: string
  constructor(yui: YuiClient, token: string) {
    this._yui = yui
    this._token = token
  }

  public async start() {
    YuiLogger.log('Connecting... 📡', EntryComponent.name)
    return this._yui.login(this._token)
  }

  public get token() {
    return this._token
  }

  public get client() {
    return this._yui
  }
}
