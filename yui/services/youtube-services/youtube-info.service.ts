import * as getYoutubeID from "get-youtube-id";
import { isYoutubeLink } from "../music-functions/music-function";
import {
  IYoutubePlaylistItemMetadata,
  IYoutubePlaylist,
  IYoutubeSearchResult
} from "../../interfaces/youtube-song-metadata.interface";
import { youtubeRequestService } from "./youtube-request.service";
import { errorLogger } from "../../handlers/error.handler";

export async function getID(query: string): Promise<string> {
  if (isYoutubeLink(query)) {
    return Promise.resolve(getYoutubeID.default(query));
  } else {
    return await requestVideo(query);
  }
}

function getPlaylistID(url: string): Promise<string> {
  return new Promise((resolve, _) => {
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

export function requestVideo(query: string): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    const json: IYoutubeSearchResult = await youtubeRequestService(
      "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=" +
        encodeURIComponent(query) +
        "&type=video&fields=items(id(kind%2CvideoId)%2Csnippet(channelId%2CchannelTitle%2Ctitle))"
    );
    if (!json) reject("Some thing went wrong");
    resolve(json.items[0].id.videoId || "3uOWvcFLUY0");
  });
}

export function getInfoIds(
  ids: string
): Promise<IYoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, reject) => {
    const json: IYoutubePlaylist = await youtubeRequestService(
      "https://www.googleapis.com/youtube/v3/videos?part=" +
        encodeURIComponent("snippet, contentDetails") +
        "&id=" +
        encodeURIComponent(ids) +
        "&fields=items(contentDetails%2Fduration%2Cid%2Csnippet(channelId%2CchannelTitle%2Cthumbnails%2Fdefault%2Ctitle))"
    );
    resolve((json && json.items) || null);
  });
}

export function getPlaylistItems(
  playlistId: string,
  _nextPageToken: string = ""
): Promise<IYoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50
      ${_nextPageToken}&playlistId=${playlistId}
      &fields=${encodeURIComponent(
        "nextPageToken,items(id,kind,snippet(channelId,channelTitle,resourceId(kind,videoId),title))"
      )}`;
    const json: IYoutubePlaylist = await youtubeRequestService(url);
    if (!json) reject("Request fail. JSON was null.");
    const { nextPageToken } = json;
    const playlistSongs = await processPlaylistItemsData(json).catch(
      handleError
    );
    let nextPageResults: IYoutubePlaylistItemMetadata[] = [];
    if (nextPageToken) {
      const pageToken = `&pageToken=${nextPageToken}`;
      nextPageResults = await getPlaylistItems(playlistId, pageToken).catch(
        handleError
      );
    }
    resolve([...playlistSongs, ...(nextPageResults || [])]);
  });
}

function processPlaylistItemsData(
  data: IYoutubePlaylist
): Promise<IYoutubePlaylistItemMetadata[]> {
  return new Promise(async (resolve, _) => {
    const tmpIdsArray: Array<string> = [];
    const [playlist] = await Promise.all(
      data.items.map(song => {
        return tmpIdsArray.push(song.snippet.resourceId.videoId);
      })
    ).catch(handleError);
    if (playlist) {
      const videos = await getInfoIds(tmpIdsArray.join(",")).catch(handleError);
      resolve(videos);
    }
  });
}

export function getSongsByChannelId(
  channelId: string,
  nextPage: string
): Promise<IYoutubeSearchResult> {
  return new Promise(async (resolve, reject) => {
    const nextPageToken = nextPage ? `&nextPageToken=${nextPage}` : ``;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=
      ${channelId}${nextPageToken}&type=video&fields=
      ${encodeURIComponent("nextPageToken, items(id(videoId))")}`;
    const json: IYoutubeSearchResult = await youtubeRequestService(url);
    if (!json) reject("Something went wrong during the process.");
    resolve(json);
  });
}

export function searchByQuery(query: string): Promise<IYoutubeSearchResult> {
  return new Promise(async (resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10
    &q=${encodeURIComponent(query)}&type=video
    &fields=items(id%2Ckind%2Csnippet(channelId%2CchannelTitle%2Ctitle))`;
    const json: IYoutubeSearchResult = await youtubeRequestService(url);
    if (!json) reject("Something went wrong during the process.");
    resolve(json);
  });
}

function handleError(error: string | Error): null {
  return errorLogger(error, "YOUTUBE_SERVICE");
}
