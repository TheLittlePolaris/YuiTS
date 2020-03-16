import type { MusicService } from './services/music/music.service'
import type { Message, TextChannel } from 'discord.js'
import { debugLogger } from './error.handler'

export class AccessControlerHandler {
  private _musicService: MusicService
  constructor(musicService: MusicService) {
    this._musicService = musicService
    debugLogger('AccessControllerHandler')
  }

  public voiceAccessController(
    message: Message,
    join: boolean
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const { channel, guild } = message
      const { voiceChannel } = message.member
      if (!voiceChannel) {
        message.reply('**please join a `__Voice Channel__`!**')
        return resolve(false)
      }
      const streams = this._musicService.streams
      const stream = streams.has(guild.id) ? streams.get(guild.id) : null
      const boundVoiceChannel = stream?.boundVoiceChannel
      // console.log(
      //   stream?.boundVoiceChannel,
      //   ' <===== BOUND VOICE CHANNELLLLLLLL'
      // );
      if (!boundVoiceChannel && join) {
        message.channel.send(
          `**Bound to Text Channel: \`${
            (channel as TextChannel).name
          }\` and Voice Channel: \`${voiceChannel?.name}\`**!`
        )
        return resolve(true)
      }
      if (boundVoiceChannel) {
        const boundTextChannel = stream?.boundTextChannel
        if (
          channel.id !== boundTextChannel.id ||
          voiceChannel.id !== boundVoiceChannel.id
        ) {
          message.reply(
            `**I'm playing at \`${boundTextChannel.name}\` -- \` ${boundVoiceChannel.name}\`**`
          )
        } else resolve(true)
      } else {
        message.reply(`**\`I'm not in any voice channel.\`**`)
      }
      return resolve(false)
    })
  }
}