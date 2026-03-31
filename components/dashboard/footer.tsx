'use client';

import Link from 'next/link';
import { ExternalLink, MessageCircle } from 'lucide-react';

interface FooterProps {
  onShowFeedback: () => void;
}

export function DashboardFooter({ onShowFeedback }: FooterProps) {
  return (
    <footer className="border-t border-white/5 mt-12 pt-8 pb-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
        <div>
          <h4 className="font-semibold text-sm mb-3">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/" className="text-neutral-500 hover:text-white transition-colors">Live Earthquakes</Link></li>
            <li><Link prefetch={false} href="/today" className="text-neutral-500 hover:text-white transition-colors">Today&apos;s Activity</Link></li>
            <li><Link prefetch={false} href="/my-area" className="text-neutral-500 hover:text-white transition-colors">My Area</Link></li>
            <li><Link prefetch={false} href="/community" className="text-neutral-500 hover:text-white transition-colors">Community</Link></li>
            <li><Link prefetch={false} href="/history" className="text-neutral-500 hover:text-white transition-colors">History</Link></li>
            <li><Link prefetch={false} href="/compare" className="text-neutral-500 hover:text-white transition-colors">Compare Regions</Link></li>
            <li><Link prefetch={false} href="/learn" className="text-neutral-500 hover:text-white transition-colors">Learn</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Safety & Guides</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/felt-earthquake" className="text-neutral-500 hover:text-white transition-colors">Did You Feel It?</Link></li>
            <li><Link prefetch={false} href="/earthquake-preparedness" className="text-neutral-500 hover:text-white transition-colors">Preparedness Guide</Link></li>
            <li><Link prefetch={false} href="/san-andreas-fault" className="text-neutral-500 hover:text-white transition-colors">San Andreas Fault</Link></li>
            <li><Link prefetch={false} href="/hayward-fault" className="text-neutral-500 hover:text-white transition-colors">Hayward Fault</Link></li>
            <li><Link prefetch={false} href="/calaveras-fault" className="text-neutral-500 hover:text-white transition-colors">Calaveras Fault</Link></li>
            <li><Link prefetch={false} href="/faq" className="text-neutral-500 hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Historical Events</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/history/1906-san-francisco" className="text-neutral-500 hover:text-white transition-colors">1906 San Francisco</Link></li>
            <li><Link prefetch={false} href="/history/1989-loma-prieta" className="text-neutral-500 hover:text-white transition-colors">1989 Loma Prieta</Link></li>
            <li><Link prefetch={false} href="/history/1868-hayward" className="text-neutral-500 hover:text-white transition-colors">1868 Hayward</Link></li>
            <li><Link prefetch={false} href="/history/2014-napa" className="text-neutral-500 hover:text-white transition-colors">2014 South Napa</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Popular Regions</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/region/san-ramon" className="text-neutral-500 hover:text-white transition-colors">San Ramon / Dublin</Link></li>
            <li><Link prefetch={false} href="/region/berkeley-oakland" className="text-neutral-500 hover:text-white transition-colors">Berkeley / Oakland</Link></li>
            <li><Link prefetch={false} href="/region/sf-peninsula" className="text-neutral-500 hover:text-white transition-colors">SF Peninsula</Link></li>
            <li><Link prefetch={false} href="/region/santa-clara" className="text-neutral-500 hover:text-white transition-colors">Santa Clara / San Jose</Link></li>
            <li><Link prefetch={false} href="/region/sonoma-napa" className="text-neutral-500 hover:text-white transition-colors">Sonoma / Napa</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Popular Cities</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/san-francisco-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">San Francisco Today</Link></li>
            <li><Link prefetch={false} href="/oakland-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">Oakland Today</Link></li>
            <li><Link prefetch={false} href="/san-jose-earthquake-today" className="text-neutral-500 hover:text-white transition-colors">San Jose Today</Link></li>
            <li><Link prefetch={false} href="/city/berkeley" className="text-neutral-500 hover:text-white transition-colors">Berkeley</Link></li>
            <li><Link prefetch={false} href="/city/fremont" className="text-neutral-500 hover:text-white transition-colors">Fremont</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-3">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link prefetch={false} href="/about" className="text-neutral-500 hover:text-white transition-colors">About Bay Tremor</Link></li>
            <li><a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1">USGS Data <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="https://www.shakealert.org/" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1">ShakeAlert <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="https://www.ready.gov/earthquakes" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1">Emergency Prep <ExternalLink className="w-3 h-3" /></a></li>
            <li><Link prefetch={false} href="/feed.xml" className="text-neutral-500 hover:text-white transition-colors">RSS Feed</Link></li>
            <li><Link prefetch={false} href="/privacy" className="text-neutral-500 hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/30 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-violet-400" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-white">Help Us Improve Bay Tremor</h4>
              <p className="text-sm text-neutral-400">Share feedback, ideas, report bugs, or inquire about advertising</p>
            </div>
          </div>
          <button
            onClick={onShowFeedback}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Send Feedback
          </button>
        </div>
      </div>
      
      <div className="text-center pt-8 border-t border-white/5">
        <p className="text-sm text-neutral-500">
          Data from{' '}
          <a href="https://earthquake.usgs.gov/" className="text-neutral-400 hover:text-white transition-colors">
            USGS Earthquake Hazards Program
          </a>
        </p>
        <p className="text-xs text-neutral-600 mt-2">
          This site provides real-time earthquake information for educational purposes.
          For emergencies, dial 911.
        </p>
        <p className="text-xs text-neutral-700 mt-4">
          © {new Date().getFullYear()} Bay Tremor. Built for the Bay Area community.
        </p>
        <p className="text-[10px] text-neutral-700 mt-3 max-w-lg mx-auto">
          Affiliate Disclosure: Some links on this site are affiliate links. As an Amazon Associate, 
          Bay Tremor earns from qualifying purchases at no extra cost to you. This helps us keep the site free.
        </p>
      </div>
    </footer>
  );
}
