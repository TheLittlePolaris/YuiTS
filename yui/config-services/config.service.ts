import { config } from 'dotenv'
import { debugLogger } from '@/handlers/log.handler'
import { LOG_SCOPE } from '@/constants/constants'
import { google } from 'googleapis'
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

    // TODO: Use oauth2.0
    public static get youtubeClientId(): string {
      return this.envConfig['YOUTUBE_CLIENT_ID']
    }

    public static get youtubeClientSecret(): string {
      return this.envConfig['YOUTUBE_CLIENT_SECRET']
    }
  }

  new ConfigService()

  global['config'] = ConfigService
})()

// TODO: Implement google oauth2 workflow
// const initGoogleAuth2Client = () => {
//   const googleAuthClient = new google.auth.OAuth2(
//     global.config.youtubeClientId,
//     global.config.youtubeClientSecret
//   )

//   const url = googleAuthClient.generateAuthUrl({
//     scope: [
//       'https://www.googleapis.com/auth/youtube',
//       'https://www.googleapis.com/auth/youtube.force-ssl',
//       'https://www.googleapis.com/auth/youtube.readonly',
//       'https://www.googleapis.com/auth/youtubepartner',
//       'https://www.googleapis.com/auth/youtubepartner-channel-audit',
//     ],
//   })
//   google.options({
//     auth: googleAuthClient,
//   })
// }
