import { Injectable } from 'djs-ioc-container';

import {
  IYoutubePlaylistResult,
  IYoutubeVideo,
  IYoutubeSearchResult
} from '../interfaces/youtube-info.interface';

import { YoutubeRequestService } from './youtube-request.service';

import { YuiLogger } from '@/logger/logger.service';

@Injectable()
export class YoutubeInfoService {
  constructor(private readonly youtubeRequestService: YoutubeRequestService) {}

  public getYoutubePlaylistId(query: string) {
    const result = /[&?|]list=([\w-]+)/gi.exec(query);
    return (result && result.length && result[1]) || null;
  }

  public async getYoutubeVideoId(query: string) {
    const result =
      /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?vi?=|&vi?=))([^#&?]*).*/gi.exec(
        query
      );
    return (result?.length && result[1]) || this.searchVideo(query);
  }

  public async searchVideo(query: string): Promise<string> {
    // todo: add error notice when fail
    const data: IYoutubeSearchResult = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      maxResults: 10,
      q: query,
      type: ['video'],
      fields: 'items(id(kind,videoId),snippet(channelId,channelTitle,title))'
    });
    if (!data) throw new Error('Something went wrong during request');

    return data?.items?.[0]?.id?.videoId || '3uOWvcFLUY0'; // default
  }

  public async getVideoMetadata(...ids: string[]): Promise<IYoutubeVideo[]> {
    const data = await this.youtubeRequestService.googleYoutubeApiVideos({
      part: ['snippet', 'contentDetails'],
      id: ids,
      fields:
        'items(contentDetails(duration),id,snippet(channelId,channelTitle,thumbnails/default,title))'
    });
    if (!data) throw new Error('Something went wrong during request');

    return data.items;
  }

  public async getPlaylistItems(
    playlistId: string,
    currentPageToken?: string
  ): Promise<IYoutubeVideo[]> {
    const data = await this.youtubeRequestService.googleYoutubeApiPlaylistItems({
      part: ['snippet'],
      playlistId,
      fields:
        'nextPageToken,items(id,kind,snippet(channelId,channelTitle,resourceId(kind,videoId),title))',
      ...(currentPageToken ? { pageToken: currentPageToken } : {}),
      maxResults: 50
    });
    if (!data) return [];

    const { nextPageToken } = data;
    const playlistSongs = await this.processPlaylistItemsData(data).catch((error) =>
      this.handleError(new Error(error))
    );
    let nextPageResults = [];
    if (nextPageToken)
      nextPageResults = await this.getPlaylistItems(playlistId, nextPageToken).catch((error) =>
        this.handleError(new Error(error))
      );

    return [...playlistSongs, ...(nextPageResults || [])];
  }

  async processPlaylistItemsData(data: IYoutubePlaylistResult): Promise<IYoutubeVideo[]> {
    const temporaryIdsArray: Array<string> = [];
    await Promise.all(
      data.items.map((song) => temporaryIdsArray.push(song.snippet.resourceId.videoId))
    ).catch((error) => this.handleError(error));

    const videos = await this.getVideoMetadata(...temporaryIdsArray).catch((error) =>
      this.handleError(error)
    );

    return videos;
  }

  public async getVideosByChannelId(
    channelId: string,
    pageToken?: string
  ): Promise<IYoutubeSearchResult> {
    const data = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      channelId,
      type: ['video'],
      fields: 'nextPageToken,items(id(videoId))',
      ...(pageToken ? { pageToken } : {})
    });
    return data;
  }

  public async getRelatedVideos(videoId: string, pageToken?: string) {
    const data = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      relatedToVideoId: videoId,
      type: ['video'],
      fields: 'nextPageToken,items(id(videoId))',
      ...(pageToken ? { pageToken } : {}),
      maxResults: 10
    });
    return data;
  }

  public async searchByQuery(query: string): Promise<IYoutubeSearchResult> {
    const data = await this.youtubeRequestService.googleYoutubeApiSearch({
      part: ['snippet'],
      maxResults: 10,
      q: query,
      type: ['video'],
      fields: 'items(id,kind,snippet(channelId,channelTitle,title))'
    });
    return data;
  }

  handleError(error: string | Error): null {
    YuiLogger.error(error, this.constructor.name);
    return null;
  }
}
