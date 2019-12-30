export function isYoutubeLink(link: string): boolean {
  if (typeof link === "string") {
    return link.indexOf("youtube.com") >= 0 || link.indexOf("youtu.be") >= 0;
  } else return false;
}

export function youtubeTimeConverter(duration: string): Promise<number> {
  return new Promise((resolve, _) => {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/).slice(1);
    var result =
      (parseInt(match[0], 10) || 0) * 3600 + // hours
      (parseInt(match[1], 10) || 0) * 60 + // minutes
      (parseInt(match[2], 10) || 0); // seconds
    resolve(result);
  });
}

export enum TimeConverterValue {
  LIVE = "LIVE"
}

export function timeConverter(duration: number) {
  return new Promise((resolve, _) => {
    if (duration === 0) {
      return resolve(TimeConverterValue.LIVE);
    }
    let totalMinutes = Math.floor(duration / 60);
    let seconds =
      duration % 60 >= 10 ? `${duration % 60}` : `0${duration % 60}`;
    if (totalMinutes < 60) {
      return resolve(`${totalMinutes}:${seconds}`);
    } else {
      //videos with duration exceed 1 hour
      let hours = Math.floor(totalMinutes / 60);
      let minutesLeft = totalMinutes % 60;
      return resolve(`${hours}:${minutesLeft}:${seconds}`);
    }
  });
}

export function RNG(range): Promise<number> {
  return new Promise<number>((resolve, _) => {
    resolve(Math.floor(Math.random() * range));
  });
}
