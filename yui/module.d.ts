declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string
    TOKEN: string
    YOUTUBE_API_KEY: string
    YOUTUBE_CLIENT_ID: string
    PREFIX: string
    TENOR_KEY: string
    TENOR_ANONYMOUS_ID: string
  }

  export interface Global {
    config: {
      prefix: string
      token: string
      yuiId: string
      ownerId: string
      youtubeApiKey: string
      youtubeClientId: string
      youtubeClientSecret: string
      tenorKey: string
      tenorAnonymousId: string
      soundcloudUserId: string
      soundcloudPassword: string
      environment: 'development' | 'production'
    }
  }
}
