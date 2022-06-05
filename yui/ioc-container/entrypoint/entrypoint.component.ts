import { Client } from 'discord.js'

export class EntrypointComponent {
  private _token: string
  constructor(private _bot: Client) {}

  public get token() {
    return this._token
  }

  public get client() {
    return this._bot
  }

  public async start(botToken: string) {
    this._token = botToken
    this._bot.login(this._token)
  }
}
