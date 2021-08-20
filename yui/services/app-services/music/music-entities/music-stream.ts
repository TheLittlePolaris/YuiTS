import type {
  Guild,
  VoiceChannel,
  TextChannel,
} from 'discord.js'
import { MusicQueue } from './music-queue'
import { YuiLogger } from '@/services/logger/logger.service'
import { AudioPlayer, AudioResource, PlayerSubscription, VoiceConnection } from '@discordjs/voice'

export class MusicStream {
  private _id: string
  private _name: string
  private _isLooping = false
  private _isQueueLooping = false
  private _isAutoPlaying = false
  private _isPlaying = false
  private _isPaused = false

  private _voiceConnection: VoiceConnection
  private _audioPlayer: AudioPlayer
  private _playerSubscription: PlayerSubscription
  private _audioResource: AudioResource

  private _autoplayChannelId: string
  private _nextPage: string
  public _queue: MusicQueue
  public _leaveOnTimeout: NodeJS.Timeout

  /**
   *
   * @param guild Current guild, get from message.guild
   * @param boundVoiceChannel Voice channel the the bot has joined: message.member.voiceChannel
   * @param boundTextChannel Text channel message was sent: message.channel
   */
  constructor(guild: Guild, public boundVoiceChannel: VoiceChannel, public boundTextChannel: TextChannel) {
    this._id = guild.id
    this._name = guild.name

    this._queue = new MusicQueue()
    this._audioPlayer = new AudioPlayer()

    YuiLogger.info(`[${this._name}] stream created!`, this.constructor.name)
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

  public get audioPlayer(): AudioPlayer {
    return this._audioPlayer
  }

  public get playerSubscription(): PlayerSubscription {
    return this._playerSubscription
  }

  public get audioResource(): AudioResource {
    return this._audioResource
  }

  public get voiceConnection(): VoiceConnection {
    return this._voiceConnection
  }

  public get autoplayChannelId(): string {
    return this._autoplayChannelId
  }

  public get nextPage(): string {
    return this._nextPage
  }

  public get queue(): MusicQueue {
    return this._queue
  }

  /**
   * @returns Current timeout for leaving the voice channel and unbound from text channel
   */
  public get leaveOnTimeout(): NodeJS.Timeout {
    return this._leaveOnTimeout
  }

  /**
   * @param value The value to be set
   * @param data Data of the selected value
   */
  public set<T>(value: keyof MusicStream, data: T): T {
    this[`_${value}`] = data
    return this[`_${value}`]
  }

  public reset() {
    this._isAutoPlaying = false
    this._isQueueLooping = false
    this._isLooping = false
    this._isPaused = false
    this._nextPage = null
    this.queue.deleteQueue()
    this.playerSubscription?.unsubscribe()
    // TODO:
    // if (this.isPlaying) {
    //   if (this.streamDispatcher && !this.streamDispatcher.destroyed) {
    //     this.streamDispatcher.destroy()
    //   }
    //   this._isPlaying = false
    // }
  }
}
