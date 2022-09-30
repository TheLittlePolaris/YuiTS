import { ISong } from '../interfaces/song-metadata.interface';

export class MusicQueue extends Array<ISong> {
  /**
   * @type {ISong[]} - ISong[]
   */
  // constructor() {}

  /**
   * @returns {boolean} Check of the queue is empty
   */
  public get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * @param {ISong} song - Add a song at the end of the queue
   */
  public addSong(song: ISong): void {
    this.push(song);
  }

  /**
   * @param {ISong} song Add the song to after the currently playing song
   */
  public addNext(song: ISong): void {
    this.splice(1, 0, song);
  }
  /**
   * @returns {ISong} Remove the song from the start of queue
   */
  public removeFirst(): ISong {
    return this.shift();
  }
  /**
   * @param {ISong} currSong - Append the song to the start of queue
   */
  public addFirst(currentSong: ISong): void {
    this.unshift(currentSong);
  }

  /**
   * @type {void} Delete the current queue
   */
  public deleteQueue(): void {
    this.length = 0;
  }
  /**
   * @type {void} Clear the current queue
   */
  public clearQueue(): void {
    this.splice(1);
  }
  /**
   * @returns {ISong} The currently playing song
   */
  public get first(): ISong {
    return this[0];
  }

  /**
   * @returns {ISong} The first song in the queue
   */
  public get firstInQueue(): ISong {
    return this[1];
  }

  /**
   * @returns {ISong} The last song in the queue
   */
  public get last(): ISong {
    return this[this.length - 1];
  }

  /**
   * @returns {number} Total duration of the queue
   */
  public get totalDuration(): number {
    const value = this.reduce(
      (accumulator: number, current: ISong) => (accumulator += current.duration),
      0
    );
    return value;
  }
  /**
   * @returns Last in the queue
   */
  public removeLast(): ISong {
    if (this.length <= 1) return null;

    return this.pop();
  }
  /**
   * @param {Number} index - start position in queue
   * @param {Number} length - the amount of songs to be removed
   */
  public removeSongs(index: number, length = 1) {
    return this.splice(index, length);
  }

  private swapData(firstIndex: number, secondIndex: number): void {
    const temporary = this[firstIndex];
    this[firstIndex] = this[secondIndex];
    this[secondIndex] = temporary;
  }
  /**
   * @type {void} - Shuffle the current queue
   */
  public shuffle(): void {
    for (let index = this.length - 1; index > 1; index--) {
      const shuffleIndex = Math.floor(Math.random() * index) + 1;
      this.swapData(index, shuffleIndex);
    }
  }

  pushNext(...data: ISong[]) {
    this.splice(1, 0, ...data);
  }
}
