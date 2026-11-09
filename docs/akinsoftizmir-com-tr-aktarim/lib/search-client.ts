import searchIndex from '@/lib/data/search-index.json';

export interface SearchItem {
  type: 'Sayfa' | 'Makale / Kampanya' | 'AI Prompt';
  title: string;
  excerpt: string;
  href: string;
}

const items = searchIndex as SearchItem[];

export function searchAllContentClient(query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q)
    )
    .slice(0, 20);
}
