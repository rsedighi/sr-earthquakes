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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  const primaryItems = NAV_ITEMS.filter(item => item.primary);
  const secondaryItems = NAV_ITEMS.filter(item => !item.primary);

  return (
    <>
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
          {primaryItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] rounded-xl transition-all ${
                  active ? 'text-white' : 'text-neutral-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] rounded-xl transition-all ${
              secondaryItems.some(item => isActive(item.href)) ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <Menu className={`w-5 h-5 ${secondaryItems.some(item => isActive(item.href)) ? 'text-blue-400' : ''}`} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl border-t border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-semibold text-white">More Options</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2 safe-area-bottom max-h-[60vh] overflow-y-auto">
              {/* Secondary Nav Items */}
              {secondaryItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      active
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Divider */}
              <div className="border-t border-white/10 my-4" />
              
              {/* About & FAQ */}
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl text-neutral-300 hover:bg-white/5 transition-all"
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">About</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl text-neutral-300 hover:bg-white/5 transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">FAQ</span>
              </Link>
              
              {/* Regions Section */}
              <div className="pt-2">
                <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Regions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.slice(0, 6).map(region => (
                    <Link
                      key={region.id}
                      href={`/region/${region.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-3 rounded-lg text-neutral-300 hover:bg-white/5 transition-all"
                    >
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                        {region.areaCode}
                      </span>
                      <span className="text-sm truncate">{region.name.split('/')[0].trim()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer for fixed bottom nav on mobile */}
      <div className="md:hidden h-20" />
    </>
  );
}

