import type { APIRoute } from 'astro';

const baseUrl = import.meta.env.PUBLIC_BASE_URL ?? 'https://baytremor.com';

export const GET: APIRoute = () => {
  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Googlebot-News
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/news-sitemap.xml
Host: ${baseUrl}
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
