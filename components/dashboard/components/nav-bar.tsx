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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-neutral-950/95 to-neutral-900/90 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around px-2 py-1 pb-safe safe-area-bottom">
          {PRIMARY_NAV.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[50px] rounded-xl transition-all ${
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
          
          {/* More Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 min-w-[50px] rounded-xl transition-all text-neutral-500 hover:text-neutral-300 active:scale-95"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Menu Content */}
            <div className="px-4 pb-8 pt-2">
              {/* Secondary Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Explore</h3>
                <div className="space-y-1">
                  {SECONDARY_NAV.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          active 
                            ? 'bg-white/10 text-white' 
                            : 'text-neutral-400 hover:bg-white/5 active:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Safety & Guides */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Safety & Guides</h3>
                <div className="space-y-1">
                  {SAFETY_GUIDES.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-white/5 active:bg-white/10 transition-all"
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
              </div>
              
              {/* Regions */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Regions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.slice(0, 6).map(region => (
                    <Link
                      key={region.id}
                      href={`/region/${region.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-white/5 active:bg-white/10 transition-all"
                    >
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                        {region.areaCode}
                      </span>
                      <span className="text-sm truncate">{region.name.split(' / ')[0]}</span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/region/san-francisco"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-blue-400 hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <Globe className="w-4 h-4" />
                  View All Regions
                </Link>
              </div>
              
              {/* About & FAQ */}
              <div className="flex gap-2 mb-6">
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-neutral-300 hover:bg-white/10 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  About
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-neutral-300 hover:bg-white/10 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </Link>
              </div>
              
              {/* Unit Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5">
                <span className="text-sm text-neutral-400">Distance Unit</span>
                <UnitToggle size="sm" showLabel={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
