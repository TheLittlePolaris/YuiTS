import { ClientOptions, Client } from 'discord.js'
import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { TFunction } from '@/constants/constants'

// Yui Client Decorator
export const Yui = ({
  prefix,
  token,
  options
}: {
  prefix: string
  token: string
  options: ClientOptions
}) => {
  console.log('======= [ YUI DECORATOR ] =======')
  return <T extends TFunction>(constructor: T) => {
    return class extends constructor {
      prefix = prefix
      token = token
      yui = new Client(options)
      messageHandler = new MessageHandler()
      voiceStateHandler = new VoiceStateHandler(
        this.messageHandler?.musicService || null
      )
    }
  }
}
