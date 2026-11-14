'use client';

import { useState, type ReactNode } from 'react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { trackAction } from '@/lib/telemetry';
import { UnitProvider, useUnits } from '@/lib/unit-context';
import { earthquakeShareCopy, shareCardUrl } from '@/lib/share-copy';

interface ShareEarthquakeProps {
  id: string;
  url: string;
  magnitude: number;
  place: string;
  timestamp: number;
}

type Method = 'native' | 'x' | 'facebook' | 'nextdoor' | 'copy' | 'download';

function XIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function NextdoorIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

// "Share This Earthquake" card for the server-rendered earthquake page.
// Standalone island, so it brings its own UnitProvider (synced via localStorage).
export function ShareEarthquake(props: ShareEarthquakeProps) {
  return (
    <UnitProvider>
      <ShareEarthquakeCard {...props} />
    </UnitProvider>
  );
}

function ShareEarthquakeCard({ id, url, magnitude, place, timestamp }: ShareEarthquakeProps) {
  const [copied, setCopied] = useState(false);
  const { unitSystem } = useUnits();
  const { title, text } = earthquakeShareCopy({ magnitude, place, timestamp }, unitSystem);
  const imageUrl = shareCardUrl(id, { unitSystem });
  const squareUrl = shareCardUrl(id, { square: true, unitSystem });
  const enc = encodeURIComponent;

  const track = (method: Method, completed = false) =>
    trackAction(completed ? 'share_completed' : 'share_started', { method, source: 'earthquake' });

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    track('native');
    try {
      if (!navigator.share) throw new Error('unsupported');
      // Attach the card itself where supported (iOS/Android) so it shows in Messages, Instagram, etc.
      const payload: ShareData = { title, text, url };
      try {
        const blob = await fetch(squareUrl).then((r) => (r.ok ? r.blob() : Promise.reject()));
        const file = new File([blob], `earthquake-${id}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) payload.files = [file];
      } catch {
        // link-only share still unfurls via og:image
      }
      await navigator.share(payload);
      track('native', true);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      await copy(`${text} ${url}`);
      track('copy', true);
    }
  };

  const links: Array<{ method: Method; href: string; label: string; className: string; icon: ReactNode }> = [
    { method: 'x', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, label: 'Share on X', className: 'bg-black hover:bg-neutral-800 border border-white/15', icon: <XIcon /> },
    { method: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, label: 'Share on Facebook', className: 'bg-[#1877F2] hover:bg-[#1864D9]', icon: <FacebookIcon /> },
    { method: 'nextdoor', href: `https://nextdoor.com/share/?url=${enc(url)}&title=${enc(title)}`, label: 'Share on Nextdoor', className: 'bg-[#00B246] hover:bg-[#009E3E]', icon: <NextdoorIcon /> },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-purple-500/15 p-5">
      <h2 className="text-xl font-bold mb-1">Share this earthquake</h2>
      <p className="text-sm text-neutral-400 mb-4">Ask friends and neighbors if they felt it. This card shows up when you share the link.</p>

      <a href={imageUrl} target="_blank" rel="noopener" className="block mb-4 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
        <img src={imageUrl} alt={`Share card: ${title}`} width={1200} height={630} loading="lazy" decoding="async" className="w-full h-auto block aspect-[1200/630]" />
      </a>

      <button
        type="button"
        onClick={nativeShare}
        className="w-full mb-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
      >
        <Share2 className="w-6 h-6 text-white" />
        <span className="text-lg font-bold text-white">{copied ? 'Link copied!' : 'Share This Earthquake'}</span>
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {links.map((l) => (
            <a key={l.method} href={l.href} target="_blank" rel="noopener noreferrer" title={l.label} aria-label={l.label}
              onClick={() => track(l.method, true)} className={`p-2.5 rounded-lg text-white transition-colors ${l.className}`}>
              {l.icon}
            </a>
          ))}
          <button type="button" onClick={async () => { await copy(url); track('copy', true); }}
            className={`p-2.5 rounded-lg flex items-center gap-2 transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20 text-neutral-200'}`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <a href={imageUrl} download={`earthquake-${id}.png`} onClick={() => track('download', true)}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Card
          </a>
          <a href={squareUrl} download={`earthquake-${id}-square.png`} onClick={() => track('download', true)}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Square
          </a>
        </div>
      </div>
    </section>
  );
}
