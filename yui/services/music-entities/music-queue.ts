import { SongMetaData } from "./song-metadata";

export class MusicQueue {
  private songs: Array<SongMetaData> = [];

  /**
   * @type {SongMetaData(id, name, channel, duration, req, vUrl, tUrl)}
   */
  constructor() {
    this.songs = [];
  }

  /**
   * @returns {boolean} Check of the queue is empty
   */
  isEmpty() {
    return this.songs.length === 0;
  }

  /**
   * @param {SongMetaData} song - Add a song at the end of the queue
   */
  addSong(song) {
    this.songs.push(song);
  }
  /**
   * @param {SongMetaData} song Add the song to after the currently playing song
   */
  addNext(song) {
    this.songs.splice(1, 0, song);
  }
  /**
   * @returns {SongMetaData} Remove the song from the start of queue
   */
  shiftSong() {
    return this.songs.shift();
  }
  /**
   * @param {SongMetaData} currSong - Append the song to the start of queue
   */
  unshiftSong(currSong) {
    this.songs.unshift(currSong);
  }
  /**
   * @param {Number} index - Position of the song
   * @returns {SongMetaData} The song at specified position
   */
  getAt(index) {
    return this.songs[index];
  }
  /**
   * @type {void} Delete the current queue
   */
  deleteQueue() {
    this.songs = [];
  }
  /**
   * @type {void} Clear the current queue
   */
  clearQueue() {
    let temp = this.songs.length - 1;
    this.songs.splice(1, temp);
  }
  /**
   * @returns {SongMetaData} The first song in the queue
   */
  get first() {
    return this.songs[0];
  }
  /**
   * @returns {SongMetaData} The last song in the queue
   */
  get last() {
    return this.songs[this.length - 1];
  }
  totalDurLength() {
    let t = 0;
    for (var i = 0; i < this.songs.length; i++) {
      t = t + Number(this.songs[i].duration);
    }
    return t;
  }
  /**
   * @returns number: the amount of songs in the queue
   */
  get length() {
    return this.songs.length;
  }

  /**
   * @returns The name of the removed song at the last of queue
   */
  popLast() {
    let t = this.songs[this.songs.length - 1].title;
    this.songs.pop();
    return t;
  }
  /**
   *  @param index - The exact posistion of the song
   *  @returns string: Name of the removed song
   */
  spliceSong(index) {
    let songName = this.songs[index].title;
    this.songs.splice(index, 1);
    return songName;
  }
  /**
   * @param {Number} index - start position in queue
   * @param {Number} length - the amount of songs to be removed
   */
  spliceSongs(index, length) {
    this.songs.splice(index, length);
  }

  private swapData(i, j) {
    let temp = this.songs[i];
    this.songs[i] = this.songs[j];
    this.songs[j] = temp;
  }

  /**
   * @type {void} - Shuffle the current queue
   */
  shuffle(): void {
    for (var i = this.length - 1; i > 1; i--) {
      let j = Math.floor(Math.random() * i) + 1;
      this.swapData(i, j);
    }
  }
}
