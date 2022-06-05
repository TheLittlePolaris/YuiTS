export const isSoundCloudUrl = (url: string): boolean => /^(https:\/\/)?(soundcloud\.com)\//g.test(url)

export const isSoundCloudSongUrl = (url: string): boolean => {
  const scSongRegexp =
    /^(https:\/\/)?(soundcloud\.com)\/(?!you|discover|stations|stream)([a-zA-Z0-9-_]+)\/(?!sets|popular-tracks|tracks|albums|reposts|likes)([a-zA-Z0-9-_]+$)/g
  return scSongRegexp.test(url)
}

/** 4 cases:
 * 1) https://soundcloud.com/wavemeow => channel all tracks including reposts
 * 2) https://soundcloud.com/naoden/tracks => channel tracks/popular-tracks/reposts
 * 3) https://soundcloud.com/polaris-nguyen/sets/honeycomebear => normal playlist
 * 4) https://soundcloud.com/polaris-nguyen/likes
 */
export const isSoundCloudPlaylistUrl = (url: string): boolean => {
  const scPlaylistRegexp =
    /^(https:\/\/)?(soundcloud\.com)\/(?!discover|you|stations|stream)([a-zA-Z0-9-_]+)(\/)?((sets\/[a-zA-Z0-9-_]+)|(popular-tracks|tracks|reposts|likes))?$/g
  return scPlaylistRegexp.test(url)
}
