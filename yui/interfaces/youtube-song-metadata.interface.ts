interface VideoThumbnail {
  url: string;
  width: string;
  height: string;
}

interface VideoSnippet {
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: VideoThumbnail;
    medium: VideoThumbnail;
    high: VideoThumbnail;
    standsart: VideoThumbnail;
    maxres: VideoThumbnail;
  };
  description: string;
  publishedAt: string;
  tags: string[];
}

interface VideoContentDetails {
  duration: string;
  definition: string;
}

export interface IYoutubeSongItemMetadata {
  id: string;
  kind: string;
  etag: string;
  snippet: VideoSnippet;
  contentDetails?: VideoContentDetails;
}

export interface IYoutubeSearchResultItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: VideoSnippet;
}
export interface IYoutubeSearchResult {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: IYoutubeSearchResultItem[];
}

interface PlaylistVideoSnippet extends VideoSnippet {
  id: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
}

export interface IYoutubePlaylistItemMetadata extends IYoutubeSongItemMetadata {
  snippet: PlaylistVideoSnippet;
}

export interface IYoutubePlaylist {
  kind: string;
  nextPageToken: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: IYoutubePlaylistItemMetadata[];
}
/**
 * Youtube song Item content
 * {
 "kind": "youtube#videoListResponse",
 "etag": "\"p4VTdlkQv3HQeTEaXgvLePAydmU/w09oC2V_ycijED-M6L9BwdRp80M\"",
 "pageInfo": {
  "totalResults": 1,
  "resultsPerPage": 1
 },
 "items": [
  {
   "kind": "youtube#video",
   "etag": "\"p4VTdlkQv3HQeTEaXgvLePAydmU/Oi3VPjH4v6YuC56KI9h5W-Ngu3k\"",
   "id": "aM7QyFgfoqI",
   "snippet": {
    "publishedAt": "2019-11-05T19:43:02.000Z",
    "channelId": "UC8grrKTG_MWQxs8ugTRefYQ",
    "title": "Bedhair - naturally occurring loneliness",
    "description": "• Artwork by しゃどNe\nhttps://pixiv.net/member.php?id=2876768\nhttps://twitter.com/shad_ne\n\n⬖ Submit Music & Art \n»  https://eternity.edmdistrict.com/signup\n\n🎧 Download\nhttps://toneden.io/bedhair/post/naturally-occurring-loneliness\n\n♫ Stream\nhttps://soundcloud.com/bedhair/naturally-occurring-loneliness\nhttps://open.spotify.com/artist/45FnpztLDOfFJbEonNltrl\n\n» Bedhair\nhttps://soundcloud.com/bedhair \nhttps://twitter.com/BedhairMusic \nhttps://instagram.com/bedhairmusic/ \nhttps://youtube.com/channel/UCzwlNxyVq5vU6aqKKH2u4NQ\n\n゜ﾟ *+:｡.｡:+* ﾟ ゜ﾟ *+:｡.｡.｡:+* ﾟ ゜ﾟ *+:｡.｡:+* ﾟ ゜\n#Bedhair #naturallyoccurringloneliness",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/aM7QyFgfoqI/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/aM7QyFgfoqI/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/aM7QyFgfoqI/hqdefault.jpg",
      "width": 480,
      "height": 360
     },
     "standard": {
      "url": "https://i.ytimg.com/vi/aM7QyFgfoqI/sddefault.jpg",
      "width": 640,
      "height": 480
     },
     "maxres": {
      "url": "https://i.ytimg.com/vi/aM7QyFgfoqI/maxresdefault.jpg",
      "width": 1280,
      "height": 720
     }
    },
    "channelTitle": "Eternity",
    "tags": [
     "Eternity",
     "Eternal",
     "Regera",
     "Kami",
     "Anime",
     "EDM",
     "Electronic",
     "Dance",
     "Music",
     "FutureBass",
     "Bedhair - naturally occurring loneliness",
     "naturally occurring loneliness",
     "Bedhair"
    ],
    "categoryId": "10",
    "liveBroadcastContent": "none",
    "localized": {
     "title": "Bedhair - naturally occurring loneliness",
     "description": "• Artwork by しゃどNe\nhttps://pixiv.net/member.php?id=2876768\nhttps://twitter.com/shad_ne\n\n⬖ Submit Music & Art \n»  https://eternity.edmdistrict.com/signup\n\n🎧 Download\nhttps://toneden.io/bedhair/post/naturally-occurring-loneliness\n\n♫ Stream\nhttps://soundcloud.com/bedhair/naturally-occurring-loneliness\nhttps://open.spotify.com/artist/45FnpztLDOfFJbEonNltrl\n\n» Bedhair\nhttps://soundcloud.com/bedhair \nhttps://twitter.com/BedhairMusic \nhttps://instagram.com/bedhairmusic/ \nhttps://youtube.com/channel/UCzwlNxyVq5vU6aqKKH2u4NQ\n\n゜ﾟ *+:｡.｡:+* ﾟ ゜ﾟ *+:｡.｡.｡:+* ﾟ ゜ﾟ *+:｡.｡:+* ﾟ ゜\n#Bedhair #naturallyoccurringloneliness"
    },
    "defaultAudioLanguage": "en"
   },
   "contentDetails": {
    "duration": "PT3M29S",
    "dimension": "2d",
    "definition": "hd",
    "caption": "false",
    "licensedContent": true,
    "projection": "rectangular"
   }
  }
 ]
}

 */

/**
  * Youtube Playlist Content
 {
 "kind": "youtube#playlistItemListResponse",
 "etag": "\"p4VTdlkQv3HQeTEaXgvLePAydmU/yiNa0AL0vTS_UU9aYQg5vwwOFjY\"",
 "nextPageToken": "CAEQAA",
 "pageInfo": {
  "totalResults": 60,
  "resultsPerPage": 1
 },
 "items": [
  {
   "kind": "youtube#playlistItem",
   "etag": "\"p4VTdlkQv3HQeTEaXgvLePAydmU/bSvheswuF-k6d20_0xHGp3nxV4E\"",
   "id": "UExzMHltWG1LWUlqVHFyTmk1X2Q0bkVHQ2JKcDRxeGotSC41NkI0NEY2RDEwNTU3Q0M2",
   "snippet": {
    "publishedAt": "2015-08-23T20:25:27.000Z",
    "channelId": "UC28Z_CXEjc21vP9O2cMyUuQ",
    "title": "Marcus Warner - Out of the Blue (Beautiful Orchestral)",
    "description": "Music by Marcus Warner\n\n\nAlbum: Liberation\niTunes:\nhttps://itunes.apple.com/gb/album/liberation/id923436435 \n\n\nFacebook:\nhttps://www.facebook.com/MarcusWarnerMusic/\nTwitter:\nhttps://twitter.com/MKWarnerMusic\nYouTube:\nhttps://www.youtube.com/user/MKWarnerMusic\nSoundcloud: https://soundcloud.com/marcuswarner \nBandcamp: http://marcuswarnermusic.bandcamp.com \nInstagram: @marcus.warner\n\nOfficial Website: http://marcuswarnermusic.com/\n\nLicensing:\nenquiries@marcuswarnermusic.com\n\n\n\nFollow me for listing more music:\nSoundcloud: https://soundcloud.com/jennyni200\nFacebook: https://www.facebook.com/MoreEpicRadio\n\nImage: http://www.eclypsia.com/fr/lol/news-7362.html",
    "thumbnails": {
     "default": {
      "url": "https://i.ytimg.com/vi/jMi4G-ZlL8U/default.jpg",
      "width": 120,
      "height": 90
     },
     "medium": {
      "url": "https://i.ytimg.com/vi/jMi4G-ZlL8U/mqdefault.jpg",
      "width": 320,
      "height": 180
     },
     "high": {
      "url": "https://i.ytimg.com/vi/jMi4G-ZlL8U/hqdefault.jpg",
      "width": 480,
      "height": 360
     },
     "standard": {
      "url": "https://i.ytimg.com/vi/jMi4G-ZlL8U/sddefault.jpg",
      "width": 640,
      "height": 480
     },
     "maxres": {
      "url": "https://i.ytimg.com/vi/jMi4G-ZlL8U/maxresdefault.jpg",
      "width": 1280,
      "height": 720
     }
    },
    "channelTitle": "WaltherStealth",
    "playlistId": "PLs0ymXmKYIjTqrNi5_d4nEGCbJp4qxj-H",
    "position": 0,
    "resourceId": {
     "kind": "youtube#video",
     "videoId": "jMi4G-ZlL8U"
    }
   },
   "contentDetails": {
    "videoId": "jMi4G-ZlL8U",
    "videoPublishedAt": "2014-10-17T13:35:44.000Z"
   }
  }
 ]
}

  */
