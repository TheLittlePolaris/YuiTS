import {
  Message,
  Guild,
  VoiceChannel,
  TextChannel,
  StreamDispatcher,
  StreamOptions,
  RichEmbed
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
import { IVoiceConnection } from "../interfaces/custom-interfaces.interface";
import { errorLogger } from "../handlers/error.handler";
export class MusicService {
  private _streams: Map<string, MusicStream> = new Map<string, MusicStream>();

  public createStream(
    guild: Guild,
    boundVoiceChannel: VoiceChannel,
    boundTextChannel: TextChannel
  ): Promise<MusicStream | null> {
    return new Promise((resolve, reject) => {
      if (!guild || !boundVoiceChannel || !boundTextChannel)
        reject(
          new Error(
            "Guild | boundVoiceChannel | boundTextChannel was not defined."
          )
        );
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
      this.sendMessage(message, "Something went wrong! Please try again");
      return Promise.resolve(
        this.handleError(new Error("Id for Guild was undefined."))
      );
    }
    console.log("message ====", message.id);

    const guildStream = await this.createStream(
      message.guild,
      message.member.voiceChannel,
      message.channel as TextChannel
    ).catch(this.handleError);

    if (!guildStream)
      return Promise.resolve(
        this.handleError(new Error("Guild stream was not created."))
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
  ): Promise<IVoiceConnection> {
    return new Promise(async (resolve, reject) => {
      console.log("creating voice connection ... ");
      const connection = (await message.member.voiceChannel
        .join()
        .catch(this.handleError)) as IVoiceConnection;
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
        const playList = await getPlaylistItems(youtubePlaylistId).catch(
          this.handleError
        );
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
    const itemInfo = await getInfoIds(videoId);
    const pushToQueue = await this.pushToQueue(
      queue,
      itemInfo,
      requester,
      true
    ).catch(this.handleError);
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
    data: IYoutubePlaylistItemMetadata[],
    requester: string,
    atEnd: boolean
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!data || !data.length) {
        this.handleError(new Error("No data was supplied"));
        reject(false);
      } else {
        const promises = data.map(
          async (_song: IYoutubePlaylistItemMetadata) => {
            if (!_song.id) {
              return this.handleError(new Error("Song id was undefined."));
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

  public async playMusic(stream: MusicStream): Promise<void> {
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
    const streamDispatcher: StreamDispatcher = stream.voiceConnection.playStream(
      ytdlStream,
      streamOptions
    );

    if (!streamDispatcher)
      return this.handleError(new Error("Stream Dispatcher was undefined."));

    stream.set("streamDispatcher", streamDispatcher);
    let sent: Message;
    stream.streamDispatcher.on("start", async () => {
      // might have been fixed https://github.com/discordjs/discord.js/pull/1745 - OR NOT
      // set(stream.voiceConnection, "player.streamingData.pausedTime", 0);
      // TODO: CHECK THIS!  set from 'lodash', just a possibility
      // stream.voiceConnection.player.streamingData.pausedTime = 0 // this is unreachable
      stream.voiceConnection.player.streamingData.pausedTime = 0; // WHY DISCORD.JS, WHYYY?
      if (!stream.isLooping) {
        sent = (await stream.boundTextChannel
          .send("**` 🎧 Now Playing: " + stream.queue.at(0).title + "`**")
          .catch(this.handleError)) as Message;
      }
    });

    stream.streamDispatcher.on("end", reason => {
      if (sent && !stream.isLooping) {
        sent.delete(50).catch(this.handleError);
      }
      const endedSong = stream.queue.shiftSong();
      if (stream.isLooping) {
        stream.queue.unshiftSong(endedSong);
      } else if (stream.isQueueLooping) {
        stream.queue.addSong(endedSong);
      }
      if (stream.queue.isEmpty) {
        if (!stream.isAutoPlaying) {
          stream.voiceConnection.speaking = false;
          return this.resetStatus(stream);
        } else {
          // return autoPlaySong(stream, temp.requester);
        }
      }
      return this.playMusic(stream).catch(this.handleError);
    });
  }

  public async addToNext(
    message: Message,
    args?: Array<string>
  ): Promise<void> {
    const stream = this._streams.get(message.guild.id);
    const queue = stream.queue;
    if (!stream.isPlaying || queue.isEmpty) {
      return this.play(message, args);
    } else {
      const _arguments = args.join(" ");
      if (isYoutubeLink(_arguments) && _arguments.indexOf("list=") > -1) {
        await stream.boundTextChannel.send(
          "Currently cannot add playlist to next. Use `>play` instead."
        );
        return Promise.resolve();
      }
      var requester = message.member.displayName;
      const songId = await getID(_arguments).catch(this.handleError);
      const song = await getInfoIds(songId).catch(this.handleError);
      const createdSong = await this.pushToQueue(
        queue,
        song,
        requester,
        false
      ).catch(this.handleError);
      if (createdSong) {
        const description =
          "*`Channel`*: **`" +
          queue.at(1).channelTitle +
          "`**" +
          "\n*`Duration`*: **`" +
          (await timeConverter(queue.at(1).duration)) +
          "`**" +
          "\n*`Position in queue`*: **`1`**";
        const embed = await discordRichEmbedConstructor({
          title: queue.at(0).title,
          embedStatus: "♬ Added Next ♬",
          authorAvatarUrl: message.author.avatarURL,
          description,
          thumbnailUrl: queue.at(1).videoThumbnail,
          appendTimeStamp: true,
          color: constants.YUI_COLOR_CODE,
          titleHyperLink: queue.at(1).videoUrl,
          footer: `Requested by ${requester}`
        });
        this.sendMessage(message, embed);
      }
    }
  }

  public async skipSongs(
    message: Message,
    args?: Array<string>
  ): Promise<void> {
    const stream = this._streams.get(message.guild.id);
    if (stream.queue.isEmpty) {
      await this.sendMessage(message, "**Nothing to skip!**");
      return Promise.resolve();
    } else {
      switch (args.length) {
        case 0: {
          if (stream.isLooping) {
            stream.set("isLooping", false);
          }
          if (!!stream.streamDispatcher) {
            stream.boundTextChannel.send(" :fast_forward: **Skipped!**");
            return Promise.resolve(stream.streamDispatcher.end());
          }
          break;
        }
        case 1: {
          if (!isNaN(args[0] as any)) {
            let numberOfSongs = Number(args[0]);
            if (numberOfSongs < 0 || numberOfSongs > stream.queue.length) {
              await this.sendMessage(
                message,
                "Index out of range! Please choose a valid one, use `>queue` for checking."
              );
              return Promise.resolve();
            }
            stream.queue.spliceSongs(1, numberOfSongs);
            if (stream.isLooping) {
              stream.set("isLooping", false);
            }
            if (stream.streamDispatcher) {
              stream.boundTextChannel.send(
                " :fast_forward: **Skipped " + numberOfSongs + " songs!**"
              );
              return Promise.resolve(stream.streamDispatcher.end());
            }
          } else {
            this.sendMessage(message, "Please enter a number!");
            return Promise.resolve();
          }
          break;
        }
        default:
          break;
      }
    }
  }

  public async autoPlay(message: Message): Promise<void> {
    const stream = this.streams.get(message.guild.id);
    if (!stream) {
      this.handleError(new Error("`stream` was undefined."));
      return Promise.resolve();
    }
    if (!stream.isAutoPlaying) {
      stream.set("isAutoPlaying", true);
      await this.createVoiceConnection(stream, message).catch(this.handleError);
      if (stream.queue.isEmpty) {
        this.sendMessage(
          message,
          "Ok, now where do we start? How about you add something first? XD"
        ).catch(this.handleError);
      }
      return Promise.resolve();
    } else {
      stream.set("isAutoPlaying", false);
      this.sendMessage(message, "**`📻 YUI's PABX MODE - OFF! 🎵`**").catch(
        this.handleError
      );
      return Promise.resolve();
    }
  }

  async autoPlaySong(stream: MusicStream, requester: string) {
    const nextPage =
      stream.nextPage ? `&pageToken=${stream.nextPage}` : ``;
    // let url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' + guild.tmp_channelId + nextPage +
    // '&type=video&fields=items(id%2FvideoId%2Csnippet(channelId%2CchannelTitle%2Cthumbnails%2Fdefault%2Ctitle))%2CnextPageToken&key=' + ytapikey;
    // request(url, async (err, respond, body) => {
    //         if (err) {
    //             autoPlaySong(guild, requester);
    //             return console.error('request-err:' + err);
    //         }
    //         var json = JSON.parse(body);
    //         if (json.error) {
    //             autoPlaySong(guild, requester);
    //             return console.error("json-err:" + json.error);
    //         }
    //         await RNG(json.items.length).then(async (rnd) => {
    //             if (json.items[rnd]) {
    //                 guild.tmp_nextPage = json.nextPageToken ? json.nextPageToken : "";
    //                 await getInfoIds(guild.queue, json.items[rnd].id.videoId, requester, true).then(() => {
    //                     playMusic(guild);
    //                 }, (error) => {
    //                     autoPlaySong(guild, requester);
    //                     return console.error('local-getInfoIds-err:' + error);
    //                 });
    //             }
    //         });
    //     });
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
          // TODO: test this
          stream.voiceConnection.player.destroy();
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
    content: string | RichEmbed
  ): Promise<Message | Message[]> {
    return message.channel.send(content).catch(this.handleError);
  }

  public get streams(): Map<string, MusicStream> {
    return this._streams;
  }

  private handleError(error: Error | string): null {
    return errorLogger(error, "MUSIC_SERVICE");
  }
}
