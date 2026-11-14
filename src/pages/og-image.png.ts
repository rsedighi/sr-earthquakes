import type { APIRoute } from 'astro';
import { cachedImage, renderPng } from '@/lib/og';
import { OG_SIZE, SiteCard } from '@/lib/og-cards';

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime?.env;
  const version = env?.CF_VERSION_METADATA?.id ?? 'dev';
  return cachedImage(`${url.origin}/__og/site?v=${version}`, locals.runtime?.ctx, () =>
    renderPng(SiteCard(), OG_SIZE, { origin: url.origin, assets: env?.ASSETS })
  );
};
