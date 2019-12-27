import {
  Message,
  Guild,
  VoiceChannel,
  TextChannel,
  StreamDispatcher,
  VoiceConnection,
  AudioPlayer,
  StreamOptions
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
  getPlaylistId,
  getPlaylistItems
} from "./youtube-services/youtube.service";
import { MusicQueue } from "./music-entities/music-queue";
import { ISong } from "../interfaces/song-metadata.interface";
import {
  IYoutubeSongItemMetadata,
  IYoutubePlaylistItemMetadata
} from "../interfaces/youtube-song-metadata.interface";
import { discordRichEmbedConstructor } from "./music-functions/music-embed-constructor";
import ytdl from "ytdl-core";
import { set, get } from "lodash";
import constants from "../constants/constants";

export class MusicService {
  private _streams: Map<string, MusicStream> = new Map();

  public createStream(
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
      resolve(stream);
    });
  }

  public async play(message: Message, args?: Array<string>): Promise<void> {
    const { id } = message.guild;
    console.log("Enter play function.");
    if (!id) {
      console.log("Error: Message without guild.");
      this.sendMessage(message, "Something went wrong! Please try again");
      return;
    }
    console.log("message ====", message.id);
    const guildStream = await this.createStream(
      message.guild,
      message.member.voiceChannel,
      message.channel as TextChannel
    );
    console.log("Created guild stream === ", guildStream.id);
    if (!guildStream.voiceConnection) {
      console.log("Enter create voice connection.");
      await this.createVoiceConnection(guildStream, message).catch(
        this.handleError
      );
    }
    const _arguments: string = args.join(" ");
    console.log("Play query arguments: ", _arguments);
    if (isYoutubeLink(_arguments) && _arguments.indexOf("list=") > -1) {
      console.log("enter queue playlist");
      this.queuePlaylist(guildStream, message, _arguments);
    } else {
      console.log("enter queue song");
      return await this.queueSong(guildStream, message, _arguments);
    }
  }

  public async createVoiceConnection(
    stream: MusicStream,
    message: Message
  ): Promise<VoiceConnection> {
    return new Promise(async (resolve, reject) => {
      console.log("creating voice connection ... ");
      const connection = await message.member.voiceChannel
        .join()
        .catch(this.handleError);
      if (!connection) reject("Could not create voice connection");
      stream.set("voiceConnection", connection);
      console.log("Created voice connection. Status == ", connection.status);
      resolve(connection);
    });
  }

  public async queuePlaylist(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    console.log("Entered queue playlist. Start enqueuing...");
    try {
      const youtubePlaylistId = await getPlaylistId(args).catch(
        this.handleError
      );
      console.log("Youtube playlist id === ", youtubePlaylistId);
      if (!!youtubePlaylistId) {
        const sentMessage: Message = (await stream.boundTextChannel
          .send(
            ":hourglass_flowing_sand: **_Loading playlist, please wait..._**"
          )
          .catch(this.handleError)) as Message;
        // TODO: Implement queue playlist
        const requester = message.member.displayName;
        const playList = await getPlaylistItems(youtubePlaylistId).catch(null);
        const nAdded = playList && playList.length;
        if (!playList) {
          stream.boundTextChannel.send("Something went wrong!");
          const error = new Error("Playlist's id not found");
          return this.handleError(error);
        }
        console.log(nAdded);
        const queuedPlaylist = await this.pushToQueue(
          stream.queue,
          playList,
          requester,
          true
        ).catch(this.handleError);
        const editedMessage = await sentMessage
          .edit(":white_check_mark: **Enqueued " + nAdded + " songs!**")
          .catch(this.handleError);
        if (stream.isPlaying === false) {
          stream.set("isPlaying", true);
          console.log("Start playing music from playlist! ==> LEGGO!!");
          this.playMusic(stream);
          stream.boundTextChannel
            .send("**`🎶 Playlist starting - NOW! 🎶`**")
            .catch(this.handleError);
        }
      }
    } catch (error) {
      stream.boundTextChannel.send(
        "Sorry, something went wrong and i couldn't get the playlist."
      );
      return this.handleError(error as Error);
    }
    Promise.resolve();
  }

  public async queueSong(
    stream: MusicStream,
    message: Message,
    args: string
  ): Promise<void> {
    console.log("Enter queue song. Start enqueuing... ");
    let requester: string = message.member.displayName;
    let queue: MusicQueue = stream.queue;
    let tempStatus: string;
    const videoId = await getID(args);
    // const [itemInfo] = await Promise.all([getInfoIds(videoId)]);
    const itemInfo = await getInfoIds(videoId);
    const pushToQueue = await this.pushToQueue(
      queue,
      itemInfo,
      requester,
      true
    );

    // const channelId = await getChannelID(queue.last.id);
    if (!stream.isPlaying) {
      console.log("play music ");
      stream.set("isPlaying", true);
      this.playMusic(stream);
      tempStatus = "♫ Now Playing ♫";
    } else tempStatus = "♬ Added To QUEUE ♬";
    var nowPlayingDescription =
      "*`Channel`*: **`" +
      queue.last.channelId +
      "`**\n*`Duration`*: **`" +
      (await timeConverter(queue.last.duration)) +
      "`**" +
      (queue.length === 1
        ? ""
        : "\n*`Position in queue`*: **`" + (queue.length - 1) + "`**");
    const embed = await discordRichEmbedConstructor({
      title: queue.last.title,
      embedStatus: tempStatus,
      authorAvatarUrl: message.author.avatarURL,
      description: nowPlayingDescription,
      color: constants.YUI_COLOR_CODE,
      thumbnailUrl: queue.last.videoThumbnail,
      appendTimeStamp: true,
      titleHyperLink: queue.last.videoUrl,
      footer: `Requested by ${requester}`
    }).catch(this.handleError);

    await stream.boundTextChannel.send(embed).catch(this.handleError);

    return Promise.resolve();
  }

  public pushToQueue(
    queue: MusicQueue,
    data: IYoutubeSongItemMetadata[],
    requester: string,
    atEnd: boolean
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!data.length) {
        this.handleError(new Error("No data was supplied"));
        reject(false);
      } else {
        const promises = data.map(
          async (_song: IYoutubePlaylistItemMetadata) => {
            if (!_song.id) {
              this.handleError(new Error("Song id was undefined."));
              return null;
            }
            const song: ISong = {
              id: _song.id,
              title: _song.snippet.title,
              channelId: _song.snippet.channelId,
              channelTitle: _song.snippet.channelTitle,
              duration: await youtubeTimeConverter(
                _song.contentDetails.duration
              ),
              requester,
              videoUrl: `https://www.youtube.com/watch?v=${_song.id}`,
              videoThumbnail: _song.snippet.thumbnails.default.url
            };
            atEnd
              ? Promise.resolve(queue.addSong(song))
              : Promise.resolve(queue.addNext(song));
          }
        );
        const [promisedPromises] = await Promise.all(promises);
        resolve(true);
      }
    });
  }

  public async playMusic(stream: MusicStream) {
    let currSong = stream.queue.at(0);
    let qual: string | number = isNaN(currSong.duration) ? 95 : "highestaudio";
    let ytdlStream = ytdl("https://www.youtube.com/watch?v=" + currSong.id, {
      quality: qual,
      filter: "audioonly"
    });
    const streamOptions: StreamOptions = {
      volume: 0.7,
      passes: 2
    };
    const streamDispatcher: StreamDispatcher = await stream.voiceConnection.playStream(
      ytdlStream,
      streamOptions
    );

    stream.set("streamDispatcher", streamDispatcher);
    let sent: Message;
    stream.streamDispatcher.on("start", () => {
      set(stream.voiceConnection, "player.streamingData.pausedTime", 0);
      // TODO: CHECK THIS!  set from 'lodash', just a possibility
      // stream.voiceConnection.player.streamingData.pausedTime = 0 // this is unreachable
      if (!stream.isLooping) {
        stream.boundTextChannel
          .send("**` 🎧 Now Playing: " + stream.queue.at(0).title + "`**")
          .then((sentMessage: Message) => {
            sent = sentMessage;
          });
      }
    });

    stream.streamDispatcher.on("end", reason => {
      if (sent && !stream.isLooping) {
        sent.delete(50);
      }
      const endedSong = stream.queue.shiftSong();
      if (stream.isLooping) {
        stream.queue.unshiftSong(endedSong);
      } else if (stream.isQueueLooping) {
        stream.queue.addSong(endedSong);
      }
      if (stream.queue.isEmpty()) {
        if (!stream.isAutoPlaying) {
          stream.voiceConnection.speaking = false;
          return this.resetStatus(stream);
        } else {
          // return autoPlaySong(stream, temp.requester);
        }
      }
      return this.playMusic(stream);
    });
  }

  public resetStatus(stream: MusicStream) {
    if (stream && stream.id) {
      stream.set("isAutoPlaying", false);
      stream.set("isQueueLooping", false);
      stream.set("isLooping", false);
      stream.set("isPaused", false);
      stream.queue.deleteQueue();
      if (stream.isPlaying) {
        if (stream.streamDispatcher) {
          // stream.voiceConnection.player.destroy();
          const currentPlayer = get(stream.voiceConnection, "player");
          currentPlayer && currentPlayer.destroy();
          stream.streamDispatcher.end("Reset status");
        }
        stream.set("isPlaying", false);
      }
    } else {
      return this.handleError(new Error("The stream as undefined"));
    }
  }

  public resetChannelStat(stream: MusicStream): Promise<boolean> {
    stream.set("boundTextChannel", null);
    stream.set("boundVoiceChannel", null);
    return Promise.resolve(this._streams.delete(stream.id));
  }

  public sendMessage(
    message: Message,
    content: string
  ): Promise<Message | Message[]> {
    return message.channel.send(content);
  }

  public get streams(): Map<string, MusicStream> {
    return this._streams;
  }

  private handleError(error: Error | string): Promise<null> {
    const now = new Date();
    console.error(
      `=========== ERROR ===========\n===== ${now.toString()} =====\n${error}`
    );
    return null;
  }
}
