export type ISongType = 'youtube' | 'soundcloud';

export interface ISong {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  duration: number; // duration in seconds
  requester: string;
  videoUrl: string;
  videoThumbnail: string;
  type: ISongType;
}

export interface ISongOption {
  requester: string;
  next?: boolean;
  type?: ISongType;
}
