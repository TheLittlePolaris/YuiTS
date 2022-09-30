import { createMethodDecorator, createParamDecorator } from 'djs-ioc-container';
import { Message } from 'discord.js';

import { bold, getVoiceChannel, replyMessage } from '../../utilities';
import { getStream } from '../entities/streams-container';

export const AccessController = (join?: boolean) =>
  createMethodDecorator((context) => {
    const message = context.getOriginalArguments<[Message]>()[0];

    const { channel, guild } = message;

    const voiceChannel = getVoiceChannel(message);

    if (!voiceChannel) {
      replyMessage(message, bold('please join a voice channel!'));
      context.terminate();
      return context;
    }

    const stream = getStream(guild.id);
    const boundVoiceChannel = stream?.voiceChannel;

    if (!boundVoiceChannel && join) return context;

    if (boundVoiceChannel) {
      const boundTextChannel = stream.textChannel;
      if (channel.id !== boundTextChannel.id || voiceChannel.id !== boundVoiceChannel.id) {
        replyMessage(
          message,
          bold(`I'm playing at ${boundTextChannel.toString()} -- ${boundVoiceChannel.toString()}`)
        );
        context.terminate();
      }
    } else replyMessage(message, "**I'm not in any voice channel.**");

    return context;
  })();

export const GuildStream = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message]>();
  return getStream(message.guild?.id);
});

export const YuiMember = createParamDecorator((context) =>
  context.client.getGuildMemberByMessage(context.getOriginalArguments<[Message]>()[0])
);
