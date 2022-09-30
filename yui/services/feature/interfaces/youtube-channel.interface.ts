import type { youtube_v3 } from 'googleapis';

export interface IYoutubeChannel extends youtube_v3.Schema$Channel {
  bilibiliRoomInfo?: {
    roomid?: number;
    title: string;
    url: string;
  };
}
