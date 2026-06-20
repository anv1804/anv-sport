export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
}

export interface Rss2JsonResponse {
  status: string;
  feed: {
    title: string;
  };
  items: Rss2JsonItem[];
}
