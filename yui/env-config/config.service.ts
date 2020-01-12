import { config } from 'dotenv';
import { debugLogger } from '../handlers/error.handler';

export interface EnvConfig {
  [key: string]: string;
}

export class ConfigService {
  public static envConfig: EnvConfig;
  constructor() {
    // This loads process.env values
    const result = config().parsed;
    if (!result || result.error) {
      throw new Error('CANNOT READ CONFIG ENVIRONMENT');
    }
    ConfigService.envConfig = result;
    debugLogger('ConfigService');
  }

  public static get token(): string {
    return this.envConfig['TOKEN'];
  }

  public static get youtubeApiKey(): string {
    return this.envConfig['YOUTUBE_API_KEY'];
  }

  public static get tenorKey(): string {
    return this.envConfig['TENOR_KEY'];
  }

  public static get tenorAnonymousId(): string {
    return this.envConfig['TENOR_ANONYMOUS_ID'];
  }

  public static get yuiId(): string {
    return this.envConfig['YUI_ID'];
  }

  public static get ownerId(): string {
    return this.envConfig['OWNER_ID'];
  }

  public static get prefix(): string {
    return this.envConfig['PREFIX'];
  }
}
