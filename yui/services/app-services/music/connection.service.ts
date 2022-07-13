import { Injectable } from 'djs-ioc-container'
import {
  VoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
  VoiceConnectionEvents
} from '@discordjs/voice'
import { Message } from 'discord.js'
import { CONNECTION_READY_TIMEOUT } from './constants/connection.constant'

@Injectable()
export class MusicConnectionService {
  constructor() {}
  async createVoiceConnection(message: Message): Promise<VoiceConnection> {
    const {
      voice: { channel: voiceChannel },
      guild: { id: guildId, voiceAdapterCreator }
    } = message.member || {}
    if (!voiceChannel) throw new Error('Voice channel not found')
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      selfDeaf: true,
      adapterCreator: voiceAdapterCreator as any
    })
    await this.connectionReady(connection)
    return connection
  }

  registerConnectionListener(
    connection: VoiceConnection,
    eventHandlers?: Partial<VoiceConnectionEvents>
  ) {
    Object.entries(eventHandlers).forEach(([event, handler]) =>
      connection.on(event as any, handler)
    )
  }

  async connectionReady(connection: VoiceConnection) {
    return new Promise((resolve) => {
      if (connection.state.status === VoiceConnectionStatus.Ready) return resolve(null)
      const timeout = setTimeout(() => {
        connection.emit(
          'error',
          new Error(`Connection was not READY after ${CONNECTION_READY_TIMEOUT / 1000}s`)
        )
        resolve(null)
      }, CONNECTION_READY_TIMEOUT)
      connection.on(VoiceConnectionStatus.Ready, () => {
        clearTimeout(timeout)
        resolve(null)
      })
    })
  }

  async cleanupConnection(connection: VoiceConnection) {
    connection.destroy()
  }
}
