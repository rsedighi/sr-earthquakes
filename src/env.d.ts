/// <reference types="astro/client" />

interface Env {
  ASSETS: Fetcher;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    cf?: Pick<
      IncomingRequestCfProperties,
      'city' | 'region' | 'country' | 'timezone' | 'colo' | 'latitude' | 'longitude'
    >;
  }
}
