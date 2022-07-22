import { createMethodDecorator, createParamDecorator } from 'djs-ioc-container'
import { Message } from 'discord.js'
import { bold, getVoiceChannel, replyMessage } from '../../utilities'
import { getStream } from '../entities/streams-container'

export const AccessController = ({ join }: { join: boolean } = { join: false }) =>
  createMethodDecorator((ctx) => {
    const message = ctx.getOriginalArguments<[Message]>()[0]

    const { channel, guild } = message

    const voiceChannel = getVoiceChannel(message)

    if (!voiceChannel) {
      replyMessage(message, bold('please join a voice channel!'))
      ctx.terminate()
      return ctx
    }

    const stream = getStream(guild.id)
    const boundVoiceChannel = stream?.voiceChannel

    if (!boundVoiceChannel && join) return ctx

    if (boundVoiceChannel) {
      const boundTextChannel = stream.textChannel
      if (channel.id !== boundTextChannel.id || voiceChannel.id !== boundVoiceChannel.id) {
        replyMessage(
          message,
          bold(`I'm playing at ${boundTextChannel.toString()} -- ${boundVoiceChannel.toString()}`)
        )
        ctx.terminate()
      }
    } else {
      replyMessage(message, `**I'm not in any voice channel.**`)
    }

    return ctx
  })()

export const GuildStream = createParamDecorator((ctx) => {
  const [message] = ctx.getOriginalArguments<[Message]>()
  return getStream(message.guild?.id)
})

export const YuiMember = createParamDecorator((ctx) => {
  return ctx.client.getGuildMemberByMessage(ctx.getOriginalArguments<[Message]>()[0])
})
