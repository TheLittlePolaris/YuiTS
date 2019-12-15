import { MusicService } from "../services/music.service";
import { GuildMember } from "discord.js";
import { VoiceState } from "../interfaces/voice-state.interface";

export class VoiceStateHandler {
  private currentMusicService: MusicService;

  constructor(musicService: MusicService) {
    this.currentMusicService = musicService;
  }

  public checkOnVoiceStateUpdate(oldMem, newMem) {
    let voiceStateCheck = this.checkOnLeave(oldMem, newMem);
    switch (voiceStateCheck.action) {
      case "clear": {
        if (voiceStateCheck.stream && voiceStateCheck.stream.leaveOnTimeOut) {
          clearTimeout(voiceStateCheck.stream.leaveOnTimeOut);
          voiceStateCheck.stream.set("leaveOnTimeout", null);
        }
        break;
      }
      case "ignore": {
        break;
      }
      case "leave": {
        if (oldMem.voiceChannel.members.size === 1) {
          const timeout = setTimeout(() => {
            this.leaveVoiceChannel(voiceStateCheck.stream);
          }, 30000);
          voiceStateCheck.stream.set("leaveOnTimeout", timeout);
        }
        break;
      }
    }
  }

  public checkOnLeave(
    oldMember: GuildMember,
    newMember: GuildMember
  ): VoiceState {
    let stream = this.currentMusicService.streams.get(oldMember.guild.id);
    let boundVoiceChannel = stream ? stream.boundVoiceChannel : undefined;
    if (boundVoiceChannel) {
      let oldMemberStatus = oldMember.voiceChannel;
      let newMemberStatus = newMember.voiceChannel;
      if (newMemberStatus === boundVoiceChannel) {
        return {
          stream,
          action: "clear"
        };
      } else if (!oldMemberStatus || oldMemberStatus !== boundVoiceChannel) {
        return {
          stream,
          action: "ignore"
        };
      } else if (!newMemberStatus || newMemberStatus !== boundVoiceChannel) {
        return {
          stream,
          action: "leave"
        };
      }
    } else {
      return {
        stream,
        action: "ignore"
      };
    }
  }

  public leaveVoiceChannel(stream) {
    stream.boundVoiceChannel.leave();
    stream.boundTextChannel.send(
      "**_There's no one around so I'll leave too. Bye~!_**"
    );
    this.currentMusicService.resetStatus(stream);
    this.currentMusicService.resetChannelStat(stream);
  }
}
