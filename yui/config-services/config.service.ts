import { config } from 'dotenv'
import { debugLogger } from '@/handlers/log.handler'
import { LOG_SCOPE } from '@/constants/constants'
;(async () => {
  interface EnvConfig {
    [key: string]: string
  }

  class ConfigService {
    public static envConfig: EnvConfig
    constructor() {
      // This loads process.env values
      ConfigService.envConfig = config().parsed
      const { error } = ConfigService?.envConfig
      if (error) {
        throw new Error(`CANNOT READ CONFIG ENVIRONMENT: ${error}`)
      }

      debugLogger(LOG_SCOPE.CONFIG_SERVICE)
    }

    public static init() {
      return new ConfigService()
    }

    public static get token(): string {
      return this.envConfig['TOKEN']
    }

    public static get youtubeApiKey(): string {
      return this.envConfig['YOUTUBE_API_KEY']
    }

    public static get tenorKey(): string {
      return this.envConfig['TENOR_KEY']
    }

    public static get tenorAnonymousId(): string {
      return this.envConfig['TENOR_ANONYMOUS_ID']
    }

    public static get yuiId(): string {
      return this.envConfig['YUI_ID']
    }

    public static get ownerId(): string {
      return this.envConfig['OWNER_ID']
    }

    public static get prefix(): string {
      return this.envConfig['PREFIX']
    }
  }

  new ConfigService()

  global['config'] = ConfigService
})()
