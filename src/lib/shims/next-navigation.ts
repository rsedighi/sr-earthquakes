export function usePathname(): string {
  if (typeof window !== 'undefined') return window.location.pathname;
  return '/';
}

export function useRouter() {
  return {
    push: (href: string) => { if (typeof window !== 'undefined') window.location.href = href; },
    replace: (href: string) => { if (typeof window !== 'undefined') window.location.replace(href); },
    back: () => { if (typeof window !== 'undefined') window.history.back(); },
    forward: () => { if (typeof window !== 'undefined') window.history.forward(); },
    prefetch: (_href: string) => {},
    refresh: () => { if (typeof window !== 'undefined') window.location.reload(); },
  };
}

export function useSearchParams(): URLSearchParams {
  if (typeof window !== 'undefined') return new URLSearchParams(window.location.search);
  return new URLSearchParams();
}

export function useParams(): Record<string, string | string[]> {
  return {};
}

export function redirect(url: string): never {
  if (typeof window !== 'undefined') window.location.href = url;
  throw new Error(`Redirect to ${url}`);
}

export function notFound(): never {
  throw new Error('Not found');
}
