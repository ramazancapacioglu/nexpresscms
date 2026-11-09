import type { MetadataRoute } from 'next';
import {
  getAllPages,
  getAllPosts,
  getAllPrompts,
  getAllCategories,
} from '@/lib/wp-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || 'https://www.akinsoftizmir.com.tr';

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-prompts/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  for (const cat of getAllCategories()) {
    entries.push({
      url: `${baseUrl}/${cat.slug}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const page of getAllPages()) {
    if (!page.path || page.slug === 'ana-sayfa') continue;
    entries.push({
      url: `${baseUrl}/${page.path}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const post of getAllPosts()) {
    entries.push({
      url: `${baseUrl}/${post.path}/`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  for (const prompt of getAllPrompts()) {
    entries.push({
      url: `${baseUrl}/${prompt.path}/`,
      lastModified: new Date(prompt.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
