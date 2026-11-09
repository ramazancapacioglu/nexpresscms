import fs from 'fs';
import path from 'path';

export interface WpPageItem {
  id: number;
  slug: string;
  path: string;
  title: string;
  excerpt: string;
  image: string | null;
  content: string;
}

export interface WpPostItem {
  id: number;
  slug: string;
  path: string;
  date: string;
  categories: number[];
  title: string;
  excerpt: string;
  image: string | null;
  content: string;
}

export interface WpPromptItem {
  id: number;
  slug: string;
  path: string;
  date: string;
  title: string;
  excerpt: string;
  image: string | null;
  content: string;
}

export interface WpCategoryItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
}

interface WpContentDataset {
  pages: WpPageItem[];
  posts: WpPostItem[];
  prompts: WpPromptItem[];
  categories: WpCategoryItem[];
}

let cachedData: WpContentDataset | null = null;

function getDataset(): WpContentDataset {
  if (!cachedData) {
    const filePath = path.join(process.cwd(), 'public', 'data', 'wp-content.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    cachedData = JSON.parse(raw) as WpContentDataset;
  }
  return cachedData;
}

export function getAllPages(): WpPageItem[] {
  return getDataset().pages;
}

export function getAllPosts(): WpPostItem[] {
  return getDataset().posts;
}

export function getAllPrompts(): WpPromptItem[] {
  return getDataset().prompts;
}

export function getAllCategories(): WpCategoryItem[] {
  return getDataset().categories;
}

export function findContentByPath(rawPath: string): {
  type: 'page' | 'post' | 'prompt' | 'category';
  item: WpPageItem | WpPostItem | WpPromptItem | WpCategoryItem;
} | null {
  const clean = rawPath.replace(/^\/|\/$/g, '').toLowerCase();
  if (!clean) return null;

  const data = getDataset();

  const cat = data.categories.find((c) => c.slug.toLowerCase() === clean);
  if (cat) {
    return { type: 'category', item: cat };
  }

  const page = data.pages.find(
    (p) => p.path.toLowerCase() === clean || p.slug.toLowerCase() === clean
  );
  if (page) {
    return { type: 'page', item: page };
  }

  const post = data.posts.find(
    (p) => p.path.toLowerCase() === clean || p.slug.toLowerCase() === clean
  );
  if (post) {
    return { type: 'post', item: post };
  }

  const lastSegment = clean.split('/').pop() || clean;
  const prompt = data.prompts.find(
    (p) =>
      p.path.toLowerCase() === clean ||
      p.slug.toLowerCase() === clean ||
      p.slug.toLowerCase() === lastSegment
  );
  if (prompt) {
    return { type: 'prompt', item: prompt };
  }

  return null;
}

export function getPostsByCategory(categoryId: number): WpPostItem[] {
  return getDataset().posts.filter((p) => p.categories.includes(categoryId));
}
