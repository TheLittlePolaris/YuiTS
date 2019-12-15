import { Guild } from "discord.js";
import { MusicStream } from "../services/music-entities/music-stream";

export interface VoiceState {
  stream: MusicStream;
  action: string;
}
