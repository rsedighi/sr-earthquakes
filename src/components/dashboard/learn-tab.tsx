'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  ExternalLink,
  Users,
  Zap,
  TrendingUp,
  Layers,
  House,
  Map,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { getMagnitudeColor } from '@/lib/analysis';
import { formatDistanceBoth } from '@/lib/units';
import { useUnits } from '@/lib/unit-context';

const FaultMap = dynamic(
  () => import('@/components/fault-map').then((mod) => mod.FaultMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-[#0a0a0a] rounded-xl relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-4 left-4 w-8 h-16 bg-white/5 border border-white/10 rounded-md animate-pulse z-10"></div>
        <div className="absolute top-4 right-4 w-32 h-10 bg-white/5 border border-white/10 rounded-xl animate-pulse z-10"></div>
        <div className="absolute bottom-6 right-4 w-24 h-6 bg-white/5 border border-white/10 rounded animate-pulse z-10"></div>
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
      </div>
    ),
  }
);

// Comprehensive Educational Section
export function LearnSection() {
  const { unitSystem } = useUnits();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };
  
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold mb-3">Earthquake Education Center</h2>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Understanding earthquakes is the first step to being prepared. 
          Learn the science, know the risks, and be ready for the Bay Area's seismic reality.
        </p>
      </div>
      
      {/* For Kids Section */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            For Kids: What is an Earthquake?
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                The Earth isn't one solid piece — it's more like a cracked eggshell! 
                The outer layer is made up of giant pieces called <strong>tectonic plates</strong> that 
                fit together like a puzzle. These plates are always moving, very slowly.
              </p>
              <p className="text-neutral-300 leading-relaxed">
                When two plates push against each other, they can get stuck. Pressure builds up, 
                like when you push two magnets together. Eventually, the plates slip past each other suddenly — 
                and that's an earthquake!
              </p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
              <h4 className="font-semibold mb-4 text-neutral-200">Fun Facts</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Earth has about 500,000 detectable earthquakes every year. Only 100,000 can be felt.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Some animals can sense earthquakes before humans feel them.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-neutral-400">The largest earthquake ever recorded was a 9.5 in Chile in 1960.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-sm text-neutral-400">Earthquakes happen under the ocean too — they can cause tsunamis!</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Drop Cover Hold On - With Official Graphics */}
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-lg">The 3 Steps: Drop, Cover, Hold On</h4>
              <a 
                href="https://www.shakeout.org/dropcoverholdon/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Source: ShakeOut.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* DROP */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 flex items-center justify-center">
                  {/* SVG Illustration for DROP */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-red-400">
                    <circle cx="50" cy="25" r="12" fill="currentColor" opacity="0.9"/>
                    <path d="M50 37 L50 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 55 L35 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 55 L65 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 42 L30 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M50 42 L70 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    {/* Ground line */}
                    <path d="M20 80 L80 80" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    {/* Arrow pointing down */}
                    <path d="M50 85 L50 95 M45 90 L50 95 L55 90" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <h5 className="font-bold text-red-400 text-xl mb-2">DROP</h5>
                <p className="text-sm text-neutral-400">
                  Get down on your hands and knees. This protects you from falling and lets you crawl to shelter.
                </p>
              </div>
              
              {/* COVER */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-2 border-orange-500/30 flex items-center justify-center">
                  {/* SVG Illustration for COVER */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-orange-400">
                    {/* Table */}
                    <rect x="15" y="35" width="70" height="5" rx="2" fill="currentColor" opacity="0.7"/>
                    <rect x="18" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    <rect x="78" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    {/* Person under table */}
                    <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.9"/>
                    <path d="M50 58 L50 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L42 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L58 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Arms protecting head */}
                    <path d="M50 60 L40 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 60 L60 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Ground */}
                    <path d="M15 80 L85 80" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <h5 className="font-bold text-orange-400 text-xl mb-2">COVER</h5>
                <p className="text-sm text-neutral-400">
                  Get under a sturdy desk or table. Cover your head and neck with your arms if no shelter is nearby.
                </p>
              </div>
              
              {/* HOLD ON */}
              <div className="text-center group">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/30 flex items-center justify-center">
                  {/* SVG Illustration for HOLD ON */}
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-yellow-400">
                    {/* Table */}
                    <rect x="15" y="35" width="70" height="5" rx="2" fill="currentColor" opacity="0.7"/>
                    <rect x="18" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    <rect x="78" y="40" width="4" height="35" fill="currentColor" opacity="0.5"/>
                    {/* Person under table holding leg */}
                    <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.9"/>
                    <path d="M50 58 L50 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L42 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M50 68 L58 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Arm holding table leg */}
                    <path d="M50 60 L22 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Other arm on head */}
                    <path d="M50 55 L55 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    {/* Shake lines */}
                    <path d="M10 30 L15 25 M10 40 L5 35" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                    <path d="M90 30 L85 25 M90 40 L95 35" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                    {/* Ground */}
                    <path d="M15 80 L85 80" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  </svg>
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <h5 className="font-bold text-yellow-400 text-xl mb-2">HOLD ON</h5>
                <p className="text-sm text-neutral-400">
                  Stay under cover and hold on until the shaking stops. Be prepared to move with your shelter.
                </p>
              </div>
            </div>
            
            {/* Official Graphics Link */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-neutral-300 mb-3">
                <strong>Download official graphics</strong> for your home, school, or workplace:
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.shakeout.org/dropcoverholdon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  ShakeOut Graphics <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.ready.gov/earthquakes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Ready.gov Guide <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.earthquakecountry.org/dropcoverholdon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  Earthquake Country <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Understanding Magnitude */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Understanding Magnitude
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400">
            The Richter magnitude scale is <strong>logarithmic</strong> — each whole number increase represents 
            10× more ground motion and about 31× more energy released. A magnitude 5.0 earthquake releases 
            31 times more energy than a 4.0, and nearly 1,000 times more than a 3.0.
          </p>
          
          <div className="space-y-3">
            {[
              { mag: 2, label: 'Micro', desc: 'Rarely felt by people. Recorded only by seismometers. About 1,300 happen daily worldwide.', energy: '63 kg TNT' },
              { mag: 3, label: 'Minor', desc: 'Often felt, but rarely causes damage. Similar to a large truck passing nearby.', energy: '2 tons TNT' },
              { mag: 4, label: 'Light', desc: 'Noticeable shaking indoors. Windows rattle, objects on shelves may fall.', energy: '63 tons TNT' },
              { mag: 5, label: 'Moderate', desc: 'Can cause damage to weak buildings. Felt widely over large areas.', energy: '2,000 tons TNT' },
              { mag: 6, label: 'Strong', desc: 'Destructive in areas up to 100 miles. Can topple poorly constructed buildings.', energy: '63,000 tons TNT' },
              { mag: 7, label: 'Major', desc: 'Causes serious damage over large areas. The 1989 Loma Prieta earthquake was 6.9.', energy: '2 million tons TNT' },
              { mag: 8, label: 'Great', desc: 'Can cause serious damage in areas several hundred miles across.', energy: '63 million tons TNT' },
            ].map(item => (
              <div key={item.mag} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: getMagnitudeColor(item.mag) + '20',
                    color: getMagnitudeColor(item.mag)
                  }}
                >
                  {item.mag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">{item.label}</span>
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-neutral-500">{item.energy}</span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bay Area Fault Lines with Interactive Map */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Map className="w-4 h-4 text-white" />
            </div>
            Bay Area Fault Lines
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400 mb-6">
            The San Francisco Bay Area sits on one of the most seismically active regions in the United States. 
            Several major fault systems run through our region, each capable of producing significant earthquakes.
          </p>
          
          {/* Interactive Fault Map - Using Leaflet with GeoJSON */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
            <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm text-neutral-400">Interactive Fault Map</span>
              <a 
                href="https://usgs.maps.arcgis.com/apps/webappviewer/index.html?id=5a6038b3a1684561a9b0aadf88412fcf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Official USGS Map <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <FaultMap height="450px" />
          </div>
          
          {/* Fault Details Grid - Last Major M6+ Events */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { 
                name: 'San Andreas Fault', 
                desc: 'The most famous fault in California. Runs 800 miles from the Salton Sea to Cape Mendocino. The 1906 San Francisco earthquake (M7.9) caused over 3,000 deaths.',
                risk: 'Very High',
                lastMajor: { year: 1906, magnitude: 7.9, location: 'San Francisco' },
                color: '#ef4444',
              },
              { 
                name: 'Hayward Fault', 
                desc: 'Runs through the East Bay, directly beneath UC Berkeley, Oakland, and Fremont. Scientists consider it the most dangerous fault in the Bay Area due to urban density.',
                risk: 'Very High',
                lastMajor: { year: 1868, magnitude: 6.8, location: 'Hayward' },
                color: '#f97316',
              },
              { 
                name: 'Calaveras Fault', 
                desc: 'Eastern fault zone running through San Ramon, Dublin, Fremont, and into Silicon Valley. Known for frequent earthquake swarms.',
                risk: 'High',
                lastMajor: { year: 1984, magnitude: 6.2, location: 'Morgan Hill' },
                color: '#eab308',
              },
              { 
                name: 'Rodgers Creek Fault', 
                desc: 'Northern extension of the Hayward Fault, through Sonoma and Napa wine country. Ruptured during the 2014 South Napa earthquake.',
                risk: 'High',
                lastMajor: { year: 2014, magnitude: 6.0, location: 'South Napa' },
                color: '#ec4899',
              },
            ].map(fault => {
              const yearsSince = new Date().getFullYear() - fault.lastMajor.year;
              return (
                <div key={fault.name} className="p-5 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fault.color }} />
                      <h4 className="font-semibold text-neutral-200">{fault.name}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      fault.risk === 'Very High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      fault.risk === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {fault.risk} Risk
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">{fault.desc}</p>
                  
                  {/* Last Major M6+ Event - Highlighted */}
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Last Major Event (M6+)</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-light" style={{ color: fault.color }}>
                        M{fault.lastMajor.magnitude.toFixed(1)}
                      </span>
                      <span className="text-neutral-300">{fault.lastMajor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-neutral-500">{fault.lastMajor.year}</span>
                      <span className="text-neutral-600">•</span>
                      <span className={`font-bold ${
                        yearsSince >= 100 ? 'text-red-400' : 
                        yearsSince >= 50 ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        {yearsSince} years ago
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* USGS Link */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-medium text-neutral-200 mb-1">Explore the Full Interactive Map</h5>
                <p className="text-sm text-neutral-400">View detailed fault traces, slip rates, and earthquake history from USGS.</p>
              </div>
              <a
                href="https://usgs.maps.arcgis.com/apps/webappviewer/index.html?id=5a6038b3a1684561a9b0aadf88412fcf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium text-sm"
              >
                USGS Fault Map <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Earthquake Swarms */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            What is an Earthquake Swarm?
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                An earthquake swarm is a series of many small earthquakes occurring in a localized area 
                over days to weeks, without a clear mainshock-aftershock pattern. Unlike typical earthquake 
                sequences where one large quake triggers smaller aftershocks, swarms involve numerous 
                similar-sized events.
              </p>
              <p className="text-neutral-400 leading-relaxed">
                The San Ramon/Dublin area frequently experiences earthquake swarms along the Calaveras Fault. 
                These swarms are caused by fluids moving through fault zones, reducing friction and allowing 
                small slips to occur.
              </p>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h5 className="font-medium text-neutral-200 mb-2">Are swarms dangerous?</h5>
                <p className="text-sm text-neutral-400">
                  Most swarms consist of small earthquakes (M2-3) and pose no direct danger. Scientists monitor 
                  them because in rare cases, they can precede larger earthquakes. However, the vast majority 
                  of Bay Area swarms end without producing damaging events.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="text-2xl font-light text-white">5-50+</div>
                  <div className="text-xs text-neutral-500 mt-1">Typical events</div>
                </div>
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="text-2xl font-light text-white">1-72h</div>
                  <div className="text-xs text-neutral-500 mt-1">Duration</div>
                </div>
                <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <div className="text-2xl font-light text-white">&lt;{formatDistanceBoth(10, unitSystem)}</div>
                                <div className="text-xs text-neutral-500 mt-1">Cluster radius</div>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h5 className="font-medium text-neutral-200 mb-3">How scientists detect swarms</h5>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">1.</span>
                    Multiple small earthquakes within a tight geographic area
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">2.</span>
                    No clear "mainshock" — events are similar in size
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">3.</span>
                    Activity elevated above normal background rate
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-500">4.</span>
                    Usually concentrated within 72 hours
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Emergency Preparedness */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <House className="w-4 h-4 text-white" />
            </div>
            Emergency Preparedness
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-neutral-400">
            The Bay Area will experience a major earthquake. The question isn't if, but when. 
            Being prepared can save your life and make recovery much easier.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Emergency Kit */}
            <div>
              <h4 className="font-semibold text-neutral-200 mb-4">Essential Emergency Kit</h4>
              <div className="space-y-2">
                {[
                  'Water (1 gallon per person per day for 3+ days)',
                  'Non-perishable food (3+ day supply)',
                  'First aid kit',
                  'Flashlight and extra batteries',
                  'Battery-powered or hand-crank radio',
                  'Wrench or pliers (to turn off utilities)',
                  'Manual can opener',
                  'Important documents in waterproof container',
                  'Cell phone chargers and backup battery',
                  'Cash in small bills',
                  'Medications and medical supplies',
                  'Sanitation and personal hygiene items',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-neutral-400 py-2 border-b border-white/5 last:border-0">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-400">
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              
              {/* Affiliate Links Placeholder */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Recommended Products</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  Get prepared with quality emergency supplies from our trusted partners.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Emergency Go Bags</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Water Storage Solutions</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-neutral-300">Emergency Food Kits</span>
                    <span className="text-xs text-neutral-500">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* What to Do */}
            <div>
              <h4 className="font-semibold text-neutral-200 mb-4">During an Earthquake</h4>
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're indoors:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Drop, Cover, and Hold On</li>
                    <li>• Stay away from windows and heavy objects</li>
                    <li>• Stay inside until shaking stops</li>
                    <li>• DO NOT run outside or to doorways</li>
                  </ul>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're outdoors:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Move to a clear area away from buildings</li>
                    <li>• Avoid power lines and trees</li>
                    <li>• Drop to the ground if you can't move</li>
                  </ul>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <h5 className="font-medium text-neutral-200 mb-2">If you're driving:</h5>
                  <ul className="text-sm text-neutral-400 space-y-1.5">
                    <li>• Pull over safely to the side</li>
                    <li>• Avoid bridges, overpasses, and power lines</li>
                    <li>• Stay in your car until shaking stops</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ShakeAlert */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            ShakeAlert: Early Warning System
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                ShakeAlert is the earthquake early warning system for the West Coast. It can give you 
                seconds to tens of seconds of warning before shaking reaches your location.
              </p>
              <p className="text-neutral-400">
                While it can't predict earthquakes, it detects them as they begin and sends alerts 
                faster than seismic waves travel. Those few seconds can be crucial for taking cover 
                or stopping machinery.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.shakealert.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                >
                  Learn about ShakeAlert
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://www.myshake.berkeley.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors font-medium border border-white/10"
                >
                  Download MyShake App
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="p-5 bg-white/[0.02] rounded-xl border border-white/5">
              <h5 className="font-medium text-neutral-200 mb-4">How much warning will I get?</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">10 miles from epicenter</span>
                  <span className="text-white font-mono">~3 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">30 miles from epicenter</span>
                  <span className="text-white font-mono">~10 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">50 miles from epicenter</span>
                  <span className="text-white font-mono">~20 seconds</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">100 miles from epicenter</span>
                  <span className="text-white font-mono">~40 seconds</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                Warning time depends on your distance from the earthquake epicenter and how quickly 
                the system can process and deliver the alert.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Resources */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
            Official Resources
          </h3>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'USGS Earthquake Hazards', url: 'https://earthquake.usgs.gov/', desc: 'Official earthquake monitoring and data' },
              { title: 'UC Berkeley Seismology Lab', url: 'https://seismo.berkeley.edu/', desc: 'Research and monitoring for Northern California' },
              { title: 'Ready.gov Earthquakes', url: 'https://www.ready.gov/earthquakes', desc: 'Federal emergency preparedness guide' },
              { title: 'ShakeAlert', url: 'https://www.shakealert.org/', desc: 'Early warning system for the West Coast' },
              { title: 'California Geological Survey', url: 'https://www.conservation.ca.gov/cgs', desc: 'State geological hazard information' },
              { title: 'SF72.org', url: 'https://sf72.org/', desc: 'San Francisco emergency preparedness' },
            ].map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-200 group-hover:text-white transition-colors">{link.title}</span>
                  <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-neutral-500">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
