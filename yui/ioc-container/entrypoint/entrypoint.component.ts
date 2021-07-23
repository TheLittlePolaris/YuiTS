import { YuiClient } from '@/custom-classes/yui-client'

export class EntrypointComponent {
  private _bot: YuiClient
  private _token: string
  constructor(yui: YuiClient, token: string) {
    this._bot = yui
    this._token = token
  }

  public async start() {
    return this._bot.login(this._token)
  }

  public get token() {
    return this._token
  }

  public get client() {
    return this._bot
  }
}
