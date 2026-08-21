import beginnerQuiltingTips from "./beginner-quilting-tips";
import quiltingTermsGlossary from "./quilting-terms-glossary";
import whereToBuyFabric from "./where-to-buy-quilting-fabric";
import type { BlogPost } from "./types";

export const posts: BlogPost[] = [
  whereToBuyFabric,
  quiltingTermsGlossary,
  beginnerQuiltingTips,
];


export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostUrl(slug: string): string {
  return `/blog/${slug}`;
}

export { type BlogPost };
