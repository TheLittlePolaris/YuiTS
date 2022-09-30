import { uniq, flatten, isNumber } from 'lodash';

export function randomNumberGenerator(range: number): number {
  return Math.floor(Math.random() * range);
}

export const uniqFlattenEntries = (value: Record<string, string>) =>
  uniq(flatten(Object.entries(value)).map((k) => k.toLowerCase()));

export const getEnumValues = (e: any) =>
  Object.keys(e)
    .map((k) => !isNumber(k) && e[k])
    .filter(Boolean);
