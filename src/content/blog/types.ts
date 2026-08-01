export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  excerpt: string;
  readingTimeMinutes: number;
  // Article body as React elements so we can include internal links, lists, and CTAs.
  renderContent: () => React.ReactNode;
}
