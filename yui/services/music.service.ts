import {
  Message,
  Guild,
  VoiceChannel,
  TextChannel,
  StreamDispatcher,
  VoiceConnection
} from "discord.js";
import { MusicStream } from "./music-entities/music-stream";
import {
  isYoutubeLink,
  youtubeTimeConverter,
  timeConverter
} from "./music-functions/music-function";
import {
  getID,
  getInfoIds,
  getPlaylistId
} from "./youtube-services/youtube.service";
import { MusicQueue } from "./music-entities/music-queue";
import { YUI_COLOR_CODE } from "../interfaces/yui-constants.interface";
import { SongMetaData } from "./music-entities/song-metadata";
import { YoutubeSongItemMetadata } from "../interfaces/youtube-song-metadata.interface";
import { embedConstructor } from "./music-functions/music-embed-constructor";
import ytdl from "ytdl-core";
import { set, get } from "lodash";

export class MusicService {
  private _streams: Map<string, MusicStream> = new Map();

  public pushStream(
    guild: Guild,
    boundVoiceChannel: VoiceChannel,
    boundTextChannel: TextChannel
  ): Promise<MusicStream> {
    return new Promise((resolve, reject) => {
      const existingStream = this._streams.get(guild.id);
      if (!!existingStream) resolve(existingStream);
      const stream = new MusicStream(
        guild,
        boundVoiceChannel,
        boundTextChannel
      );
      this._streams.set(guild.id, stream);
      return stream;
    });
  }

  public async play(message: Message, args?: Array<string>): Promise<void> {
    const { id } = message.guild;
    if (!id) {
      this.sendMessage(message, "Something went wrong! Please try again");
      return;
    }
    const guildStream = await this.pushStream(
      message.guild,
      message.member.voiceChannel,
      message.channel as TextChannel
    );
    if (!guildStream.voiceConnection)
      await this.createVoiceConnection(guildStream, message);
    const _arguments: string = args.join(" ");
    if (isYoutubeLink(_arguments) && args.indexOf("list=") > -1) {
      this.queuePlaylist(guildStream, message, _arguments);
    } else {
      return await this.queueSong(guildStream, message, _arguments);
    }
  }

  public async createVoiceConnection(
    stream: MusicStream,
    message: Message
  ): Promise<VoiceConnection> {
    return new Promise(async (res, rej) => {
      const connection = await message.member.voiceChannel.join();
      stream.set("voiceConnection", connection);
      res(connection);
    });
  }

  public async queuePlaylist(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    try {
      const youtubePlaylistId = await getPlaylistId(args).catch(null);
      if (!!youtubePlaylistId) {
        const sentMessage = stream.boundTextChannel
          .send(
            ":hourglass_flowing_sand: **_Loading playlist, please wait..._**"
          )
          .catch(console.error);
        if (!!sentMessage) {
          let nextPageToken = "";
          let oldQueueLength = stream.queue.length;
          // await this.getItems(
          //   stream,
          //   youtubePlaylistId,
          //   nextPageToken,
          //   sentMessage,
          //   oldQueueLength,
          //   message.member.displayName
          // ).catch(console.error);
        }
      }
      // await getPlaylistId(args, function (playlistID) {
      //     guild.boundTextChannel.send(":hourglass_flowing_sand: **_Loading playlist, please wait..._**").then(async (msg) => {
      //         let nextPageToken = '';
      //         let oldQueueLength = guild.queue.length;
      //         await getItems(guild, playlistID, nextPageToken, msg, oldQueueLength, message.member.displayName).catch(console.error);
      //     }).catch(console.error);
      // });
    } catch (err) {
      stream.boundTextChannel.send(
        "Sorry, something went wrong and i couldn't get the playlist."
      );
      console.error(err + "");
      return Promise.resolve(null);
    }
  }

  public getItems() {}

  public async queueSong(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    let requester: string = message.member.displayName;
    let queue: MusicQueue = stream.queue;
    let tempStatus: string;
    const videoId = await getID(args);
    const [itemInfo] = await Promise.all([getInfoIds(videoId)]);
    const [pushToQueue] = await Promise.all([
      this.pushToQueue(queue, itemInfo[0], requester, true)
    ]);
    // const channelId = await getChannelID(queue.last.id);
    if (!stream.isPlaying) {
      stream.set("isPlaying", true);
      this.playMusic(stream);
      tempStatus = "♫ Now Playing ♫";
    }
    var nowPlayingDescription =
      "*`Channel`*: **`" +
      queue.last.channelId +
      "`**\n*`Duration`*: **`" +
      (await timeConverter(queue.last.duration)) +
      "`**" +
      (queue.length === 1
        ? ""
        : "\n*`Position in queue`*: **`" + (queue.length - 1) + "`**");
    const embed = await embedConstructor({
      title: queue.last.title,
      embedStatus: tempStatus,
      authorAvatarUrl: message.author.avatarURL,
      description: nowPlayingDescription,
      color: YUI_COLOR_CODE,
      thumbnailUrl: queue.last.thumbnailUrl,
      appendTimeStamp: true,
      titleHyperLink: queue.last.videoUrl,
      footer: `Requested by ${requester}`
    });
    message.channel.send(embed).catch(console.error);
  }

  public pushToQueue(
    queue: MusicQueue,
    data: YoutubeSongItemMetadata,
    requester: string,
    atEnd: boolean
  ) {
    return new Promise(async (resolve, reject) => {
      if (!data.id) reject("Video not available.");
      else {
        const id = data.id,
          title = data.snippet.title,
          channelId = data.snippet.channelId,
          channelTitle = data.snippet.channelTitle,
          duration = await youtubeTimeConverter(data.contentDetails.duration),
          videoUrl = `https://www.youtube.com/watch?v=${id}`,
          thumbnailUrl = data.snippet.thumbnails.default.url;
        const newSong = new SongMetaData(
          id,
          title,
          channelId,
          channelTitle,
          duration,
          requester,
          videoUrl,
          thumbnailUrl
        );
        if (atEnd) {
          resolve(queue.addSong(newSong));
        } else {
          resolve(queue.addNext(newSong));
        }
      }
    });
  }

  public async playMusic(stream: MusicStream) {
    let currSong = stream.queue.getAt(0);
    let qual: string | number = isNaN(currSong.duration) ? 95 : "highestaudio";
    let ytdlStream = ytdl("https://www.youtube.com/watch?v=" + currSong.id, {
      quality: qual,
      filter: "audioonly"
    });
    const streamDispatcher: StreamDispatcher = await stream.voiceConnection.playStream(
      ytdlStream,
      {
        volume: 0.7,
        passes: 2
      }
    );
    stream.set("streamDispatcher", streamDispatcher);
    let sent;
    stream.streamDispatcher.on("start", () => {
      set(stream.streamDispatcher, "");
      if (!stream.isLooping) {
        stream.boundTextChannel
          .send("**` 🎧 Now Playing: " + stream.queue.getAt(0).title + "`**")
          .then(msg => {
            sent = msg;
          });
      }
    });
    stream.streamDispatcher.on("end", reason => {
      if (sent && !stream.isLooping) {
        sent.delete(50);
      }
      let temp = stream.queue.shiftSong();
      if (stream.isLooping) {
        stream.queue.unshiftSong(temp);
      } else if (stream.isQueueLooping) {
        stream.queue.addSong(temp);
      }
      if (stream.queue.isEmpty()) {
        if (!stream.isAutoPlaying) {
          const voiceConnection = get(stream, "voiceConnection");
          voiceConnection && voiceConnection.setSpeaking(false);
          this.resetStatus(stream);
        } else {
          // return autoPlaySong(stream, temp.requester);
        }
      } else {
        this.playMusic(stream);
      }
    });
  }

  public resetStatus(stream: MusicStream) {
    // let stream = this.streams.get(guildId);
    if (stream) {
      stream.set("isAutoPlaying", false);
      stream.set("isQueueLooping", false);
      stream.set("isLooping", false);
      stream.set("isPaused", false);
      stream.queue.deleteQueue();
      if (stream.isPlaying) {
        if (stream.streamDispatcher) {
          // stream.voiceConnection.player.destroy();
          const currentPlayer = get(stream.voiceConnection, "player");
          currentPlayer.destroy();
          stream.streamDispatcher.end();
        }
        stream.set("isPlaying", false);
      }
    } else {
      return console.log("Reset_status_no_guild.");
    }
  }

  public resetChannelStat(stream: MusicStream) {
    stream.set("boundTextChannel", null);
    stream.set("boundVoiceChannel", null);
    this._streams.delete(stream.id);
  }

  public sendMessage(
    message: Message,
    str: string
  ): Promise<Message | Message[]> {
    return message.channel.send(str);
  }

  public get streams(): Map<string, MusicStream> {
    return this._streams;
  }
}
