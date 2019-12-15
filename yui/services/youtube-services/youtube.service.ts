import * as getYoutubeID from "get-youtube-id";
import { isYoutubeLink } from "../music-functions/music-function";
import {
  YoutubePlaylistItemMetadata,
  YoutubePlaylist,
  YoutubeSearchResult
} from "../../interfaces/youtube-song-metadata.interface";
import { youtubeRequestService } from "./request.service";

export async function getID(str: string): Promise<string> {
  if (isYoutubeLink(str)) {
    return Promise.resolve(getYoutubeID.default(str));
  } else {
    return await requestVideo(str);
  }
}

function getPlaylistID(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const isPlaylist: string = url.match(/[&|\?]list=([a-zA-Z0-9_-]+)/i)[1];
    resolve(isPlaylist);
  });
}

export async function getPlaylistId(args) {
  if (!isYoutubeLink(args)) {
    throw new Error("Argument is not a youtube link.");
  } else {
    return await getPlaylistID(args);
  }
}

export function requestVideo(query): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    const json: YoutubeSearchResult = await youtubeRequestService(
      "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=" +
        encodeURIComponent(query) +
        "&type=video&fields=items(id(kind%2CvideoId)%2Csnippet(channelId%2CchannelTitle%2Ctitle))"
    );
    resolve(json.items[0].id.videoId);
  });
}

export function getInfoIds(
  ids: string
): Promise<YoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, reject) => {
    const json: YoutubePlaylist = await youtubeRequestService(
      "https://www.googleapis.com/youtube/v3/videos?part=" +
        encodeURIComponent("snippet, contentDetails") +
        "&id=" +
        encodeURIComponent(ids) +
        "&fields=items(contentDetails%2Fduration%2Cid%2Csnippet(channelId%2CchannelTitle%2Cthumbnails%2Fdefault%2Ctitle))"
    );
    resolve(json.items);
  });
}

export function getPlaylistItems(
  playlistId: string,
  _nextPageToken: string
): Promise<YoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, reject) => {
    const json: YoutubePlaylist = await youtubeRequestService(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50" +
        _nextPageToken +
        "&playlistId=" +
        playlistId +
        "&fields=items(id%2Ckind%2Csnippet(channelId%2CchannelTitle%2CresourceId(kind%2CvideoId)%2Ctitle))%2CnextPageToken"
    );
    const { nextPageToken } = json;
    const playlistSongs = await processPlaylistItemsData(json).catch(null);
    let nextPageResults: YoutubePlaylistItemMetadata[] = [];
    if (nextPageToken) {
      const pageToken = `&pageToken=${nextPageToken}`;
      nextPageResults = await getPlaylistItems(playlistId, pageToken);
    }
    resolve([...playlistSongs, ...nextPageResults]);
  });
}

function processPlaylistItemsData(
  data: YoutubePlaylist
): Promise<YoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, reject) => {
    const tmpIdsArray: Array<string> = [];
    const [playlist] = await Promise.all(
      data.items.map(song => {
        return tmpIdsArray.push(song.snippet.resourceId.videoId);
      })
    ).catch(err => Promise.resolve(null));
    if (playlist) {
      const videos = await getInfoIds(tmpIdsArray.join(",")).catch(null);
      resolve(videos);
    }
  });
}
