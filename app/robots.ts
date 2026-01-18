import { MetadataRoute } from 'next'

/**
 * Generates a robots.txt file to guide search engine crawlers.
 * 
 * @returns {MetadataRoute.Robots} The robots configuration.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://revotracker.dvcklab.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
