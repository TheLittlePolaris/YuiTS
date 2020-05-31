import { ISong } from '../music-interfaces/song-metadata.interface'

export class MusicQueue {
  private songs: Array<ISong> = []

  /**
   * @type {ISong[]} - ISong[]
   */
  constructor() {}

  /**
   * @returns {boolean} Check of the queue is empty
   */
  public get isEmpty() {
    return this.songs.length === 0
  }

  /**
   * @param {ISong} song - Add a song at the end of the queue
   */
  public addSong(song: ISong) {
    this.songs.push(song)
  }
  /**
   * @param {ISong} song Add the song to after the currently playing song
   */
  public addNext(song: ISong) {
    this.songs.splice(1, 0, song)
  }
  /**
   * @returns {ISong} Remove the song from the start of queue
   */
  public removeFirst() {
    return this.songs.shift()
  }
  /**
   * @param {ISong} currSong - Append the song to the start of queue
   */
  public addFirst(currSong: ISong) {
    this.songs.unshift(currSong)
  }
  /**
   * @param {Number} index - Position of the song
   * @returns {ISong} The song at specified position
   */
  public at(index) {
    return this.songs[index]
  }
  /**
   * @type {void} Delete the current queue
   */
  public deleteQueue() {
    this.songs = []
  }
  /**
   * @type {void} Clear the current queue
   */
  public clearQueue() {
    let temp = this.songs.length - 1
    this.songs.splice(1, temp)
  }
  /**
   * @returns {ISong} The first song in the queue
   */
  public get first() {
    return this.songs[0]
  }
  /**
   * @returns {ISong} The last song in the queue
   */
  public get last() {
    const { length } = this.songs
    return this.songs[length - 1]
  }

  /**
   * @returns {number} Total duration of the queue
   */
  public get totalDuration(): Promise<number> {
    return new Promise(async (resolve, _) => {
      let totalTime = 0
      await Promise.all(this.songs.map((song) => (totalTime += song.duration)))
      resolve(totalTime)
    })
  }
  /**
   * @returns number: the amount of songs in the queue
   */
  public get length() {
    return this.songs.length
  }

  /**
   * @returns The name of the removed song at the last of queue
   */
  public removeLast() {
    let tempTitle = this.songs[this.songs.length - 1].title
    this.songs.pop()
    return tempTitle
  }
  /**
   * @param {Number} index - start position in queue
   * @param {Number} length - the amount of songs to be removed
   */
  public removeSongs(index: number, length: number = 1) {
    this.songs.splice(index, length)
  }

  private swapData(i: number, j: number) {
    let temp = this.songs[i]
    this.songs[i] = this.songs[j]
    this.songs[j] = temp
  }
  /**
   * @type {void} - Shuffle the current queue
   */
  public shuffle(): void {
    for (var i = this.length - 1; i > 1; i--) {
      let j = Math.floor(Math.random() * i) + 1
      this.swapData(i, j)
    }
  }
}
