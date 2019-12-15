import {
  Guild,
  VoiceChannel,
  TextChannel,
  StreamDispatcher,
  VoiceConnection
} from "discord.js";
import { MusicQueue } from "./music-queue";
import { MusicStreamValue } from "../../interfaces/music-stream.interface";

export class MusicStream {
  private _id: string;
  private _name: string;
  private _isLooping: boolean = false;
  private _isQueueLooping: boolean = false;
  private _isAutoPlaying: boolean = false;
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;
  private _streamDispatcher: StreamDispatcher;
  private _voiceConnection: VoiceConnection;
  private _tempChannelId: string;
  private _nextPage: string;
  private _hasNextPage: boolean = false;
  public _queue: MusicQueue;
  public _boundVoiceChannel: VoiceChannel;
  public _boundTextChannel: TextChannel;
  public _leaveOnTimeout: NodeJS.Timeout;
  constructor(
    guild: Guild,
    boundVoiceChannel: VoiceChannel,
    boundTextChannel: TextChannel
  ) {
    this._id = guild.id;
    this._name = guild.name;
    this._boundVoiceChannel = boundVoiceChannel;
    this._boundTextChannel = boundTextChannel;
    this._queue = new MusicQueue();
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get isLooping(): boolean {
    return this._isLooping;
  }

  public get isQueueLooping(): boolean {
    return this._isQueueLooping;
  }
  public get isAutoPlaying(): boolean {
    return this._isAutoPlaying;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public get streamDispatcher(): StreamDispatcher {
    return this._streamDispatcher;
  }

  public get voiceConnection(): VoiceConnection {
    return this._voiceConnection;
  }

  public get tempChannelId(): string {
    return this._tempChannelId;
  }

  public get nextPage(): string {
    return this._nextPage;
  }

  public get hasNextPage(): boolean {
    return this._hasNextPage;
  }

  public get queue(): MusicQueue {
    return this._queue;
  }

  public get boundVoiceChannel(): VoiceChannel {
    return this._boundVoiceChannel;
  }

  public get boundTextChannel(): TextChannel {
    return this._boundTextChannel;
  }

  public get leaveOnTimeOut(): NodeJS.Timeout {
    return this._leaveOnTimeout;
  }

  public set(value: MusicStreamValue, data: any): any {
    if (!this[`_${value}`]) this[`_${value}`] = data;
    return this[`_${value}`] || undefined;
  }
}
