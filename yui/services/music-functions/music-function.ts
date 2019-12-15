export function isYoutubeLink(link: string): boolean {
  if (typeof link === "string") {
    return link.indexOf("youtube.com") >= 0 || link.indexOf("youtu.be") >= 0;
  } else return false;
}

export function youtubeTimeConverter(duration): Promise<number> {
  return new Promise(resolve => {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/).slice(1);
    var result =
      (parseInt(match[0], 10) || 0) * 3600 +
      (parseInt(match[1], 10) || 0) * 60 +
      (parseInt(match[2], 10) || 0);
    resolve(result);
  });
}

enum TimeConverterValue {
  LIVE = "LIVE"
}

export function timeConverter(number: number) {
  return new Promise(resolve => {
    if (number === 0) {
      return resolve(TimeConverterValue.LIVE);
    }
    let totalMinutes = Math.floor(number / 60);
    let seconds = number % 60 >= 10 ? `${number % 60}` : `0${number % 60}`;
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
