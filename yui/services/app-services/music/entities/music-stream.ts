import type {
  Guild,
  VoiceChannel,
  TextChannel,
  MessageOptions,
  MessagePayload,
  Message
} from 'discord.js'
import { MusicQueue } from './music-queue'
import { YuiLogger } from '@/services/logger/logger.service'
import {
  AudioPlayer,
  AudioResource,
  createAudioResource,
  PlayerSubscription,
  VoiceConnection
} from '@discordjs/voice'
import { discordRichEmbedConstructor, sendMessageToChannel } from '../../utilities'
import { ISong } from '../interfaces'

export class MusicStream {
  private _id: string
  private _name: string
  private _isLooping = false
  private _isQueueLooping = false
  private _isAutoPlaying = false
  private _isPlaying = false
  private _isPaused = false

  private _audioPlayer: AudioPlayer
  private _playerSubscription: PlayerSubscription
  private _audioResource: AudioResource

  private _autoplayVideoId: string
  private _autoplayQueue: ISong[]

  private _nextPage: string
  private _queue: MusicQueue
  private _leaveOnTimeout: NodeJS.Timeout

  /**
   *
   * @param guild Current guild, get from message.guild
   * @param voiceChannel Voice channel the the bot has joined: message.member.voiceChannel
   * @param textChannel Text channel message was sent: message.channel
   * @param voiceConnection The voice connection associated with the voiceChannel
   */
  constructor(
    guild: Guild,
    public voiceChannel: VoiceChannel,
    public textChannel: TextChannel,
    public voiceConnection: VoiceConnection
  ) {
    this._id = guild.id
    this._name = guild.name

    this._queue = new MusicQueue()
    this._audioPlayer = new AudioPlayer()

    this._autoplayQueue = []

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

  public get autoplayVideoId(): string {
    return this._autoplayVideoId
  }

  public get nextPage(): string {
    return this._nextPage
  }

  public get queue(): MusicQueue {
    return this._queue
  }

  public get autoplayQueue(): ISong[] {
    return this._autoplayQueue
  }

  /**
   * @description Remove the first song from Autoplay Queue and return it
   */
  public get autoplayNext(): ISong {
    return this._autoplayQueue.at(0)
  }

  public get hasAutoplay(): boolean {
    return this.autoplayQueue.length > 0
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
    this._isPlaying = false
    this._isPaused = false
    this._nextPage = null
    this.queue.deleteQueue()
    this.playerSubscription?.unsubscribe()
  }

  public playAudio(
    audioSource: Parameters<typeof createAudioResource>[0],
    options: Parameters<typeof createAudioResource>[1] & { metadata: { [key: string]: string } }
  ) {
    if (this.playerSubscription) this.playerSubscription.unsubscribe()

    const resource = createAudioResource(audioSource, options)
    this.audioPlayer.play(resource)
    const subscription = this.voiceConnection.subscribe(this.audioPlayer)
    this.set('playerSubscription', subscription)
    this.set('audioResource', resource)

    return this.audioPlayer
  }

  public sendMessage(content: string | MessagePayload | MessageOptions): Promise<Message | null> {
    if (!this.textChannel) return null
    return sendMessageToChannel(this.textChannel, content)
  }

  public sendNowPlaying() {
    return this.sendMessage({
      embeds: [
        discordRichEmbedConstructor({
          title: `${!this._isAutoPlaying ? '🎧  Now Playing' : ':infinity: Autoplaying'}: ${
            this.queue.first.title
          }`,
          description: ''
        })
      ]
    })
  }

  public enqueue(data: ISong[]): number {
    return this._queue.push(...data)
  }

  public enqueueFromAutoplayQueue() {
    this._queue.push(this.autoplayQueue.shift())
  }

  public importAutoplayQueue(data: ISong[]): number {
    return this.autoplayQueue.push(...data)
  }
}
