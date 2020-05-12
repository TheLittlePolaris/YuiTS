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
      ConfigService.envConfig = config({
        path: `.env.${process.env.NODE_ENV || `development`}`,
      }).parsed
      const { error } = ConfigService?.envConfig
      if (error) {
        throw new Error(`Fatal: CANNOT READ CONFIG ENVIRONMENT: ${error}`)
      }

      debugLogger(LOG_SCOPE.CONFIG_SERVICE)
    }

    public static init() {
      return new ConfigService()
    }

    public static get token(): string {
      return this.envConfig['TOKEN']
    }

    public static get tokenStaging(): string {
      return this.envConfig['TOKEN_STAGING']
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

    public static get prefixStaging(): string {
      return this.envConfig['PREFIX_STAGING']
    }

    // TODO: Use oauth2.0
    public static get youtubeClientId(): string {
      return this.envConfig['YOUTUBE_CLIENT_ID']
    }

    public static get youtubeClientSecret(): string {
      return this.envConfig['YOUTUBE_CLIENT_SECRET']
    }

    public static get environment(): 'development' | 'production' {
      return this.envConfig['ENVIRONMENT'] as any
    }
  }

  new ConfigService()

  global['config'] = ConfigService
})()
