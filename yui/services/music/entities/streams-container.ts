import { MusicStream } from './music-stream';

export const streamsContainer = {};

export const getStream = (guildId: string): MusicStream => {
  if (!guildId) return null;

  return streamsContainer[guildId];
};

export const addStream = (guildId: string, musicStream: MusicStream) => {
  if (!guildId) return null;

  return (streamsContainer[guildId] = musicStream);
};

export const getBoundVoiceChannel = (guildId: string) => getStream(guildId)?.voiceChannel;

export const getBoundTextChannel = (guildId: string) => getStream(guildId)?.textChannel;

export const deleteStream = (guildId: string): boolean => delete streamsContainer[guildId];
