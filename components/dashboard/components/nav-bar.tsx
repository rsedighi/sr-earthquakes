'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  MessageCircle,
  MapPin,
  BarChart3,
  History,
  BookOpen,
  FileText,
  HelpCircle,
  Globe,
  ChevronDown,
} from 'lucide-react';

// Navigation items configuration
const NAV_ITEMS = [
  { id: 'live', label: 'Live', href: '/', icon: Activity, primary: true },
  { id: 'neighborhood', label: 'My Area', href: '/my-area', icon: MapPin, primary: true },
  { id: 'community', label: 'Discuss', href: '/community', icon: MessageCircle, primary: true },
  { id: 'history', label: 'History', href: '/history', icon: History, primary: false },
  { id: 'compare', label: 'Compare', href: '/compare', icon: BarChart3, primary: false },
  { id: 'learn', label: 'Learn', href: '/learn', icon: BookOpen, primary: false },
] as const;

const REGIONS = [
  { id: 'san-francisco', name: 'San Francisco', areaCode: '415', county: 'San Francisco', faultLine: 'San Andreas Fault' },
  { id: 'marin', name: 'Marin / Sausalito / San Rafael', areaCode: '415', county: 'Marin', faultLine: 'San Andreas Fault' },
  { id: 'fremont-newark', name: 'Fremont / Newark / Union City', areaCode: '510', county: 'Alameda', faultLine: 'Hayward Fault' },
  { id: 'san-ramon', name: 'San Ramon / Dublin / Pleasanton', areaCode: '925', county: 'Contra Costa / Alameda', faultLine: 'Calaveras Fault' },
  { id: 'berkeley-oakland', name: 'Berkeley / Oakland / Piedmont', areaCode: '510', county: 'Alameda', faultLine: 'Hayward Fault' },
  { id: 'sf-peninsula', name: 'SF Peninsula / Millbrae / Pacifica', areaCode: '650', county: 'San Mateo', faultLine: 'San Andreas Fault' },
  { id: 'santa-clara', name: 'Santa Clara / San Jose / Morgan Hill', areaCode: '408', county: 'Santa Clara', faultLine: 'Calaveras Fault' },
  { id: 'gilroy', name: 'Gilroy / Hollister / South Valley', areaCode: '831', county: 'Santa Clara / San Benito', faultLine: 'Calaveras/San Andreas' },
  { id: 'sonoma-napa', name: 'Sonoma / Napa / North Bay', areaCode: '707', county: 'Sonoma / Napa', faultLine: 'Rodgers Creek Fault' },
  { id: 'richmond', name: 'Richmond / Hercules / Pinole', areaCode: '510', county: 'Contra Costa', faultLine: 'Hayward Fault' },
  { id: 'vallejo', name: 'Vallejo / Benicia / Martinez', areaCode: '707', county: 'Solano / Contra Costa', faultLine: 'Concord/Green Valley Fault' },
  { id: 'antioch', name: 'Antioch / Brentwood / Pittsburg', areaCode: '925', county: 'Contra Costa', faultLine: 'Greenville Fault' },
];

interface NavBarProps {
  currentPath?: string;
  earthquakeCount?: number;
}

export function NavBar({ currentPath = '/', earthquakeCount }: NavBarProps) {
  const [regionsOpen, setRegionsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-neutral-950/95 to-neutral-900/90 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around px-2 py-1 pb-safe safe-area-bottom">
          {NAV_ITEMS.filter(item => item.primary).map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] rounded-xl transition-all ${
                  active 
                    ? 'text-white bg-white/10 backdrop-blur-sm shadow-lg' 
                    : 'text-neutral-500 hover:text-neutral-300 active:scale-95'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-t border-white/5 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Main Nav Links */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.id === 'live' && earthquakeCount !== undefined && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/10">
                        {earthquakeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Secondary Links */}
            <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-4 ml-4">
              <Link
                href="/about"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                About
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ
              </Link>
              
              {/* Regions Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setRegionsOpen(!regionsOpen)}
                  onBlur={() => setTimeout(() => setRegionsOpen(false), 200)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Regions
                  <ChevronDown className={`w-3 h-3 transition-transform ${regionsOpen ? 'rotate-180' : ''}`} />
                </button>
                {regionsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[420px] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 py-2 max-h-[70vh] overflow-y-auto">
                    {REGIONS.map(region => (
                      <Link
                        key={region.id}
                        href={`/region/${region.id}`}
                        className="flex items-center gap-4 px-4 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="w-12 text-center font-mono text-base font-bold px-2 py-1 rounded-md bg-white/20 text-white border border-white/30 flex-shrink-0">
                          {region.areaCode}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">{region.name}</div>
                          <div className="text-xs text-neutral-500">{region.county} County • {region.faultLine}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

