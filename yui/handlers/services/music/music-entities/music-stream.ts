import { Guild, VoiceChannel, TextChannel, StreamDispatcher } from 'discord.js'
import { MusicQueue } from './music-queue'
import { MusicStreamValue } from './interfaces/music-stream.interface'
import { IVoiceConnection } from '@/interfaces/custom-interfaces.interface'
import { debugLogger } from '@/handlers/error.handler'

export class MusicStream {
  private _id: string
  private _name: string
  private _isLooping: boolean = false
  private _isQueueLooping: boolean = false
  private _isAutoPlaying: boolean = false
  private _isPlaying: boolean = false
  private _isPaused: boolean = false
  public _streamDispatcher: StreamDispatcher
  public _voiceConnection: IVoiceConnection
  private _tempChannelId: string
  private _nextPage: string
  public _queue: MusicQueue
  public _boundVoiceChannel: VoiceChannel
  public _boundTextChannel: TextChannel
  public _leaveOnTimeout: NodeJS.Timeout

  /**
   *
   * @param guild Current guild, get from message.guild
   * @param boundVoiceChannel Voice channel the the bot has joined: message.member.voiceChannel
   * @param boundTextChannel Text channel message was sent: message.channel
   */
  constructor(
    guild: Guild,
    boundVoiceChannel: VoiceChannel,
    boundTextChannel: TextChannel
  ) {
    this._id = guild.id
    this._name = guild.name
    this._boundVoiceChannel = boundVoiceChannel
    this._boundTextChannel = boundTextChannel
    this._queue = new MusicQueue()
    debugLogger('Music Stream')
  }

  /**
   * @returns id of the guild/stream
   */
  public get id(): string {
    return this._id
  }

  /**
   * @returns name of the guild/stream
   */
  public get name(): string {
    return this._name
  }

  public get isLooping(): boolean {
    return this._isLooping
  }

  public get isQueueLooping(): boolean {
    return this._isQueueLooping
  }
  public get isAutoPlaying(): boolean {
    return this._isAutoPlaying
  }

  public get isPlaying(): boolean {
    return this._isPlaying
  }

  public get isPaused(): boolean {
    return this._isPaused
  }

  public get streamDispatcher(): StreamDispatcher {
    return this._streamDispatcher
  }

  public get voiceConnection(): IVoiceConnection {
    return this._voiceConnection
  }

  public get tempChannelId(): string {
    return this._tempChannelId
  }

  public get nextPage(): string {
    return this._nextPage
  }

  public get queue(): MusicQueue {
    return this._queue
  }

  public get boundVoiceChannel(): VoiceChannel {
    return this._boundVoiceChannel
  }

  public get boundTextChannel(): TextChannel {
    return this._boundTextChannel
  }

  /**
   * @returns Current timeout for leaving the voice channel and unbound from text channel
   */
  public get leaveOnTimeOut(): NodeJS.Timeout {
    return this._leaveOnTimeout
  }

  /**
   * @param value The value to be set
   * @param data Data of the selected value
   */
  public set<T>(value: MusicStreamValue, data: T): T {
    this[`_${value}`] = data
    return this[`_${value}`]
  }
}
