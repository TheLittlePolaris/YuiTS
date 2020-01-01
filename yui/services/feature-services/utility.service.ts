import constants from "../../constants/constants";
import request from "request";
import { errorLogger } from "../../handlers/error.handler";
import { TenorApiQueryResult } from "../../interfaces/tenor-query.interface";

export function isMyOwner(userId: string) {
  return userId === constants.OWNER_ID;
}

export function tenorRequestService(
  query: string
): Promise<TenorApiQueryResult> {
  return new Promise<TenorApiQueryResult>((resolve, reject) => {
    request(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(
        `anime ${query}`
      )}&key=${process.env.TENOR_KEY}&limit=10&media_filter=basic&anon_id=${
        process.env.TENOR_ANONYMOUS_ID
      }`,
      (err: string, _, body: string) => {
        if (err) return reject(err);
        const json = JSON.parse(body);
        const { error } = json;
        if (error) reject(handleRequestErrors(error));
        resolve(json);
      }
    );
  });
}

function handleRequestErrors(error: string): null {
  return errorLogger(error, "UTILITY_SERVICE");
}
