import { MetadataRoute } from 'next'
import { createPublicPb } from "@/lib/server/pocketbase";

/**
 * Generates a sitemap for the application to improve SEO.
 * Includes static routes and dynamic gym routes.
 *
 * @returns {Promise<MetadataRoute.Sitemap>} An array of sitemap entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revotracker.dvcklab.com'

  let gymEntries: MetadataRoute.Sitemap = []
  try {
    const pb = createPublicPb();
    const gyms = await pb.collection("Revo_Gyms").getFullList({
      fields: "name",
      batch: 200,
    });
    gymEntries = gyms.map((gym) => ({
      url: `${baseUrl}/gyms/${encodeURIComponent(gym.name)}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error("Failed to fetch gyms for sitemap:", error)
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
