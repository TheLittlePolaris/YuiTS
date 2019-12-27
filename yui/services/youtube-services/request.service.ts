import request from "request";

export function youtubeRequestService<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request(
      `${url}&key=${process.env.YOUTUBE_API_KEY}`,
      (err: string, response, body: string) => {
        if (err) {
          handleRequestErrors(err);
          reject("Something went wrong");
        }
        const json = JSON.parse(body);
        const { error } = json;
        if (error) {
          handleRequestErrors(error);
          resolve(null);
        }
        resolve(json);
      }
    );
  });
}

function handleRequestErrors(error: string): void {
  const now = new Date();
  return console.error(
    `=========== ERROR ===========\n
     ===== ${now.toString()} =====\n
    ${error}`
  );
}
