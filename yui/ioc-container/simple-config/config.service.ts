import { config } from 'dotenv'
import { Injectable } from '../decorators'

interface EnvConfig {
  [key: string]: string
}

@Injectable()
export class SimpleConfigService {
  private _configValues: EnvConfig
  constructor() {
    const dotenvConfig = config({ path: '.env' }) || {}

    const { error, parsed } = dotenvConfig

    if (error) throw new Error(`Fatal: CANNOT READ CONFIG ENVIRONMENT: ${error}`)

    this._configValues = parsed
  }

  public get config() {
    return this._configValues
  }
}
