import { MetadataRoute } from 'next'
import { db } from "@/app/db/database";
import { revoGyms } from "@/app/db/schema";

/**
 * Generates a sitemap for the application to improve SEO.
 * Includes static routes and dynamic gym routes.
 * 
 * @returns {Promise<MetadataRoute.Sitemap>} An array of sitemap entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use environment variable for base URL if available, otherwise fallback
  // In production, ensure NEXT_PUBLIC_BASE_URL is set in your environment variables.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revo-tracker.com'

  // Fetch all gyms from the revoGyms table to include dynamic routes
  let gymEntries: MetadataRoute.Sitemap = []
  try {
    const gyms = await db.select({ name: revoGyms.name }).from(revoGyms);
    gymEntries = gyms.map((gym) => ({
      url: `${baseUrl}/gyms/${encodeURIComponent(gym.name)}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error("Failed to fetch gyms for sitemap:", error)
    // Fallback if DB fetch fails - at least we have static routes
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/gyms`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-to-use`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...gymEntries,
  ]
}
