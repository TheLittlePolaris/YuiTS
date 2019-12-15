/**
 * @property {id, titile, channel, duration, requester, videoUrl, thumbnailUrl}
 */
export class SongMetaData {
  private _id: string;
  private _name: string;
  private _channelTitle: string;
  private _channelId: string;
  private _duration: number;
  private _requester: string;
  private _videoUrl: string;
  private _videoThumbnail: string;
  constructor(
    id: string,
    name: string,
    channelId: string,
    channelTitle: string,
    duration: number,
    requester: string,
    videoUrl: string,
    videoThumbnail: string
  ) {
    this._id = id;
    this._name = name;
    this._channelId = channelId;
    this._channelTitle = channelTitle;
    this._duration = duration;
    this._requester = requester;
    this._videoUrl = videoUrl;
    this._videoThumbnail = videoThumbnail;
  }
  public create(
    id: string,
    name: string,
    channelId: string,
    duration: number,
    requester: string,
    videoUrl: string,
    videoThumbnail: string
  ): SongMetaData {
    this._id = id;
    this._name = name;
    this._channelTitle = channelId;
    this._duration = duration;
    this._requester = requester;
    this._videoUrl = videoUrl;
    this._videoThumbnail = videoThumbnail;
    return this;
  }
  /**
   * @type {string}
   */
  get id() {
    return this._id;
  }
  /**
   * @type {string}
   */
  get title() {
    return this._name;
  }
  /**
   * @type {string} Name of the channel
   */
  get channelTitle() {
    return this._channelTitle;
  }
  /**
   * @type {string} Id of the channel
   */
  get channelId() {
    return this._channelId;
  }
  /**
   * @type {string, miliseconds}
   */
  get duration() {
    return this._duration;
  }
  /**
   * @type {string}
   */
  get requester() {
    return this._requester;
  }
  /**
   * @type {string}
   */
  get videoUrl() {
    return this._videoUrl;
  }
  /**
   * @type {string}
   */
  get thumbnailUrl() {
    return this._videoThumbnail;
  }
}

// module.exports = SongMetaData
