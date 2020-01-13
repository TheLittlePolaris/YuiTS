export interface TenorApiQueryResult {
  next: string;
  results: TenorGIFObject[];
}

interface TenorGIFObject {
  created: number;
  hasaudio: boolean;
  id: string;
  media: TenorMediaObject[];
  tags: string[];
  title: string;
  itemurl: string; // full URL
  hascaption: string;
  url: string; // short URL
}

interface TenorMediaObject {
  gif: { preview: string; url: string; dims: number[]; size: number };
}
