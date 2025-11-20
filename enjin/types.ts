export interface Clips {
  captions: Caption[];
  clips: Clip[];
  originalVideoPath: string;
  progress: number;
  status: string;
  videoFps: string;
  workflowId: string;
  youtubeURL: string;
  youtubeVideoDetail: YoutubeVideoDetail;
  youtubeVideoId: string;
}

export interface Caption {
  confidence: number;
  endMs: number;
  startMs: number;
  text: string;
  timestampMs: number;
}

export interface Clip {
  categories: string[];
  description: string;
  editings: Editing[];
  hashtags: string[];
  overallScore: number;
  platform: string;
  targetDurationMs: number;
  title: string;
}

export interface Editing {
  endMs: number;
  fileId: string;
  hookScore: number;
  id: string;
  reason: string;
  startMs: number;
  title: string;
  transitionFunction: string;
  viralScore: number;
}

export interface YoutubeVideoDetail {
  etag: string;
  items: Item[];
  kind: string;
  pageInfo: PageInfo;
}

export interface Item {
  contentDetails: ContentDetails;
  etag: string;
  id: string;
  kind: string;
  snippet: Snippet;
}

export interface ContentDetails {
  caption: string;
  contentRating: ContentRating;
  definition: string;
  dimension: string;
  duration: string;
  licensedContent: boolean;
  projection: string;
}

export interface Snippet {
  categoryId: string;
  channelId: string;
  channelTitle: string;
  defaultAudioLanguage: string;
  defaultLanguage: string;
  description: string;
  liveBroadcastContent: string;
  localized: Localized;
  publishedAt: string;
  tags: string[];
  thumbnails: Thumbnails;
  title: string;
}

export interface Localized {
  description: string;
  title: string;
}

export interface Thumbnails {
  default: Default;
  high: High;
  maxres: Maxres;
  medium: Medium;
  standard: Standard;
}

export interface Default {
  height: number;
  url: string;
  width: number;
}

export interface High {
  height: number;
  url: string;
  width: number;
}

export interface Maxres {
  height: number;
  url: string;
  width: number;
}

export interface Medium {
  height: number;
  url: string;
  width: number;
}

export interface Standard {
  height: number;
  url: string;
  width: number;
}

export interface PageInfo {
  resultsPerPage: number;
  totalResults: number;
}

export interface YouTubeV3VideosResponse {
  kind: string;
  etag: string;
  items: Item[];
  pageInfo: PageInfo;
}

// TODO: use real types from api
export type ContentRating = Record<string, unknown>;
