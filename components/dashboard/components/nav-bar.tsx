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
  Newspaper,
  AlertTriangle,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';
import { UnitToggle } from '@/components/unit-toggle';

// Primary navigation items (shown on mobile bottom bar)
const PRIMARY_NAV = [
  { id: 'live', label: 'Live', href: '/', icon: Activity },
  { id: 'neighborhood', label: 'My Area', href: '/my-area', icon: MapPin },
  { id: 'blog', label: 'News', href: '/blog', icon: Newspaper },
  { id: 'community', label: 'Discuss', href: '/community', icon: MessageCircle },
] as const;

// Secondary navigation items (desktop only)
const SECONDARY_NAV = [
  { id: 'history', label: 'History', href: '/history', icon: History },
  { id: 'compare', label: 'Compare', href: '/compare', icon: BarChart3 },
  { id: 'learn', label: 'Learn', href: '/learn', icon: BookOpen },
] as const;

// Safety & Guides dropdown items
const SAFETY_GUIDES = [
  { id: 'felt', label: 'Did You Feel It?', href: '/felt-earthquake', icon: Zap, description: 'Report what you felt' },
  { id: 'preparedness', label: 'Preparedness Guide', href: '/earthquake-preparedness', icon: Shield, description: 'Be ready for the next quake' },
  { id: 'san-andreas', label: 'San Andreas Fault', href: '/san-andreas-fault', icon: Layers, description: 'California\'s most famous fault' },
  { id: 'hayward', label: 'Hayward Fault', href: '/hayward-fault', icon: AlertTriangle, description: 'Bay Area\'s most dangerous' },
  { id: 'calaveras', label: 'Calaveras Fault', href: '/calaveras-fault', icon: Activity, description: 'Earthquake swarm hotspot' },
] as const;

// Regions dropdown
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
  const [safetyOpen, setSafetyOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation - hidden on mobile, Dashboard has its own mobile bottom nav */}
      <nav className="hidden md:block border-t border-white/5 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Main Nav Links */}
            <div className="flex items-center gap-1">
              {/* Primary Items */}
              {PRIMARY_NAV.map(item => {
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
              
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-1" />
              
              {/* Secondary Items */}
              {SECONDARY_NAV.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Secondary Links & Dropdowns */}
            <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-4 ml-4">
              {/* Safety & Guides Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setSafetyOpen(!safetyOpen);
                    setRegionsOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setSafetyOpen(false), 200)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                    safetyOpen ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Safety
                  <ChevronDown className={`w-3 h-3 transition-transform ${safetyOpen ? 'rotate-180' : ''}`} />
                </button>
                {safetyOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[320px] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 py-2 max-h-[70vh] overflow-y-auto">
                    {SAFETY_GUIDES.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white">{item.label}</div>
                            <div className="text-xs text-neutral-500">{item.description}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Regions Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setRegionsOpen(!regionsOpen);
                    setSafetyOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setRegionsOpen(false), 200)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                    regionsOpen ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
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
              
              {/* Unit Toggle */}
              <div className="border-l border-white/10 pl-3 ml-2">
                <UnitToggle size="sm" showLabel={true} />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
