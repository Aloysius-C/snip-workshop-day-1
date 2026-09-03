export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

export interface ApiError {
  error: string;
}
