'use client';

import { useState, useMemo, useCallback } from 'react';
import { Earthquake } from '@/lib/types';
import { 
  Search, 
  Filter, 
  X, 
  Plus, 
  Save, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Zap,
  TrendingUp,
  MapPin,
  Users,
  Layers
} from 'lucide-react';

// Query parser and builder types
export interface QueryCondition {
  id: string;
  field: 'magnitude' | 'distance' | 'felt' | 'depth' | 'time' | 'location';
  operator: '>' | '<' | '>=' | '<=' | '=' | 'between' | 'contains';
  value: string | number | [number, number];
  label: string;
}

export interface QueryTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  conditions: Omit<QueryCondition, 'id'>[];
}

// Facet types
export interface FacetOption {
  label: string;
  value: string;
  count: number;
  checked: boolean;
}

export interface Facet {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FacetOption[];
  expanded: boolean;
}

// Predefined query templates for non-technical users
const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'felt-significant',
    name: 'Felt by Many',
    icon: <Users className="w-4 h-4" />,
    description: 'Earthquakes felt by 50+ people',
    conditions: [
      { field: 'felt', operator: '>=', value: 50, label: 'felt by at least 50 people' }
    ]
  },
  {
    id: 'strong-nearby',
    name: 'Strong & Close',
    icon: <Zap className="w-4 h-4" />,
    description: 'M3.0+ within 10 miles',
    conditions: [
      { field: 'magnitude', operator: '>=', value: 3.0, label: 'magnitude ≥ 3.0' },
      { field: 'distance', operator: '<=', value: 10, label: 'within 10 miles' }
    ]
  },
  {
    id: 'recent-active',
    name: 'Recent Activity',
    icon: <Clock className="w-4 h-4" />,
    description: 'Last 24 hours',
    conditions: [
      { field: 'time', operator: '<=', value: 24, label: 'in the last 24 hours' }
    ]
  },
  {
    id: 'shallow-strong',
    name: 'Shallow Events',
    icon: <Layers className="w-4 h-4" />,
    description: 'Shallow earthquakes (< 5km)',
    conditions: [
      { field: 'depth', operator: '<', value: 5, label: 'depth less than 5km' }
    ]
  },
  {
    id: 'significant',
    name: 'Significant Only',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'M4.0+ earthquakes',
    conditions: [
      { field: 'magnitude', operator: '>=', value: 4.0, label: 'magnitude ≥ 4.0' }
    ]
  }
];

// Auto-complete suggestions
const AUTO_COMPLETE_SUGGESTIONS = {
  magnitude: [
    { text: 'magnitude > 2.0', query: { field: 'magnitude', operator: '>', value: 2.0 } },
    { text: 'magnitude > 3.0', query: { field: 'magnitude', operator: '>', value: 3.0 } },
    { text: 'magnitude > 4.0', query: { field: 'magnitude', operator: '>', value: 4.0 } },
    { text: 'magnitude between 2.0 and 4.0', query: { field: 'magnitude', operator: 'between', value: [2.0, 4.0] } },
  ],
  felt: [
    { text: 'felt by people', query: { field: 'felt', operator: '>', value: 0 } },
    { text: 'felt by more than 10 people', query: { field: 'felt', operator: '>', value: 10 } },
    { text: 'felt by more than 50 people', query: { field: 'felt', operator: '>', value: 50 } },
    { text: 'felt by more than 100 people', query: { field: 'felt', operator: '>', value: 100 } },
  ],
  distance: [
    { text: 'within 5 miles', query: { field: 'distance', operator: '<=', value: 5 } },
    { text: 'within 10 miles', query: { field: 'distance', operator: '<=', value: 10 } },
    { text: 'within 25 miles', query: { field: 'distance', operator: '<=', value: 25 } },
    { text: 'more than 25 miles away', query: { field: 'distance', operator: '>', value: 25 } },
  ],
  depth: [
    { text: 'shallow depth (< 5km)', query: { field: 'depth', operator: '<', value: 5 } },
    { text: 'moderate depth (5-15km)', query: { field: 'depth', operator: 'between', value: [5, 15] } },
    { text: 'deep (> 15km)', query: { field: 'depth', operator: '>', value: 15 } },
  ],
  time: [
    { text: 'in the last hour', query: { field: 'time', operator: '<=', value: 1 } },
    { text: 'in the last 24 hours', query: { field: 'time', operator: '<=', value: 24 } },
    { text: 'in the last week', query: { field: 'time', operator: '<=', value: 168 } },
    { text: 'in the last month', query: { field: 'time', operator: '<=', value: 720 } },
  ],
};

interface EarthquakeExplorerProps {
  earthquakes: Earthquake[];
  userLocation: { lat: number; lon: number } | null;
  onResultsChange: (filtered: Earthquake[]) => void;
  getDistance: (eq: Earthquake) => number; // Distance in miles
}

export function EarthquakeExplorer({
  earthquakes,
  userLocation,
  onResultsChange,
  getDistance
}: EarthquakeExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeConditions, setActiveConditions] = useState<QueryCondition[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [showFacets, setShowFacets] = useState(true);
  const [savedQueries, setSavedQueries] = useState<QueryTemplate[]>([]);

  // Generate facets from earthquake data
  const generateFacets = useCallback((): Facet[] => {
    if (!earthquakes.length) return [];

    // Magnitude facets
    const magnitudeBuckets = [
      { label: 'Micro (< 2.0)', min: 0, max: 2.0 },
      { label: 'Minor (2.0-3.0)', min: 2.0, max: 3.0 },
      { label: 'Light (3.0-4.0)', min: 3.0, max: 4.0 },
      { label: 'Moderate (4.0-5.0)', min: 4.0, max: 5.0 },
      { label: 'Strong (5.0+)', min: 5.0, max: 10.0 },
    ];

    const magnitudeOptions = magnitudeBuckets.map(bucket => ({
      label: bucket.label,
      value: `mag_${bucket.min}_${bucket.max}`,
      count: earthquakes.filter(eq => eq.magnitude >= bucket.min && eq.magnitude < bucket.max).length,
      checked: false
    })).filter(opt => opt.count > 0);

    // Distance facets (if user location available)
    const distanceOptions = userLocation ? [
      { label: '0-5 miles', value: 'dist_0_5', min: 0, max: 5 },
      { label: '5-10 miles', value: 'dist_5_10', min: 5, max: 10 },
      { label: '10-25 miles', value: 'dist_10_25', min: 10, max: 25 },
      { label: '25-50 miles', value: 'dist_25_50', min: 25, max: 50 },
      { label: '50+ miles', value: 'dist_50_plus', min: 50, max: 10000 },
    ].map(bucket => ({
      label: bucket.label,
      value: bucket.value,
      count: earthquakes.filter(eq => {
        const dist = getDistance(eq);
        return dist >= bucket.min && dist < bucket.max;
      }).length,
      checked: false
    })).filter(opt => opt.count > 0) : [];

    // Felt facets
    const feltCount = earthquakes.filter(eq => eq.felt && eq.felt > 0).length;
    const feltOptions = [
      { label: 'Felt by people', value: 'felt_yes', count: feltCount, checked: false },
      { label: 'Not reported felt', value: 'felt_no', count: earthquakes.length - feltCount, checked: false },
    ].filter(opt => opt.count > 0);

    // Depth facets
    const depthOptions = [
      { label: 'Shallow (< 5km)', value: 'depth_shallow', min: 0, max: 5 },
      { label: 'Moderate (5-15km)', value: 'depth_moderate', min: 5, max: 15 },
      { label: 'Deep (15+ km)', value: 'depth_deep', min: 15, max: 1000 },
    ].map(bucket => ({
      label: bucket.label,
      value: bucket.value,
      count: earthquakes.filter(eq => eq.depth >= bucket.min && eq.depth < bucket.max).length,
      checked: false
    })).filter(opt => opt.count > 0);

    // Time facets
    const now = Date.now();
    const timeOptions = [
      { label: 'Last hour', value: 'time_1h', hours: 1 },
      { label: 'Last 24 hours', value: 'time_24h', hours: 24 },
      { label: 'Last week', value: 'time_1w', hours: 168 },
      { label: 'Last month', value: 'time_1m', hours: 720 },
      { label: 'Last year', value: 'time_1y', hours: 8760 },
    ].map(bucket => ({
      label: bucket.label,
      value: bucket.value,
      count: earthquakes.filter(eq => (now - eq.timestamp) <= bucket.hours * 60 * 60 * 1000).length,
      checked: false
    })).filter(opt => opt.count > 0);

    return [
      {
        id: 'magnitude',
        label: 'Magnitude',
        icon: <TrendingUp className="w-4 h-4" />,
        options: magnitudeOptions,
        expanded: true
      },
      ...(distanceOptions.length > 0 ? [{
        id: 'distance',
        label: 'Distance',
        icon: <MapPin className="w-4 h-4" />,
        options: distanceOptions,
        expanded: true
      }] : []),
      {
        id: 'felt',
        label: 'Felt Reports',
        icon: <Users className="w-4 h-4" />,
        options: feltOptions,
        expanded: true
      },
      {
        id: 'depth',
        label: 'Depth',
        icon: <Layers className="w-4 h-4" />,
        options: depthOptions,
        expanded: true
      },
      {
        id: 'time',
        label: 'When',
        icon: <Clock className="w-4 h-4" />,
        options: timeOptions,
        expanded: true
      }
    ];
  }, [earthquakes, userLocation, getDistance]);

  // Initialize facets
  useMemo(() => {
    setFacets(generateFacets());
  }, [generateFacets]);

  // Filter earthquakes based on active conditions
  const filteredEarthquakes = useMemo(() => {
    if (activeConditions.length === 0) return earthquakes;

    return earthquakes.filter(eq => {
      return activeConditions.every(condition => {
        switch (condition.field) {
          case 'magnitude':
            if (condition.operator === '>') return eq.magnitude > (condition.value as number);
            if (condition.operator === '>=') return eq.magnitude >= (condition.value as number);
            if (condition.operator === '<') return eq.magnitude < (condition.value as number);
            if (condition.operator === '<=') return eq.magnitude <= (condition.value as number);
            if (condition.operator === 'between') {
              const [min, max] = condition.value as [number, number];
              return eq.magnitude >= min && eq.magnitude <= max;
            }
            break;
          
          case 'distance':
            if (!userLocation) return true;
            const distance = getDistance(eq);
            if (condition.operator === '<') return distance < (condition.value as number);
            if (condition.operator === '<=') return distance <= (condition.value as number);
            if (condition.operator === '>') return distance > (condition.value as number);
            if (condition.operator === '>=') return distance >= (condition.value as number);
            break;
          
          case 'felt':
            const feltCount = eq.felt || 0;
            if (condition.operator === '>') return feltCount > (condition.value as number);
            if (condition.operator === '>=') return feltCount >= (condition.value as number);
            if (condition.operator === '<') return feltCount < (condition.value as number);
            if (condition.operator === '<=') return feltCount <= (condition.value as number);
            break;
          
          case 'depth':
            if (condition.operator === '<') return eq.depth < (condition.value as number);
            if (condition.operator === '<=') return eq.depth <= (condition.value as number);
            if (condition.operator === '>') return eq.depth > (condition.value as number);
            if (condition.operator === '>=') return eq.depth >= (condition.value as number);
            if (condition.operator === 'between') {
              const [min, max] = condition.value as [number, number];
              return eq.depth >= min && eq.depth <= max;
            }
            break;
          
          case 'time':
            const hoursAgo = (Date.now() - eq.timestamp) / (1000 * 60 * 60);
            if (condition.operator === '<') return hoursAgo < (condition.value as number);
            if (condition.operator === '<=') return hoursAgo <= (condition.value as number);
            break;
        }
        return true;
      });
    });
  }, [earthquakes, activeConditions, userLocation, getDistance]);

  // Update parent when results change
  useMemo(() => {
    onResultsChange(filteredEarthquakes);
  }, [filteredEarthquakes, onResultsChange]);

  // Add condition from template
  const applyTemplate = (template: QueryTemplate) => {
    const newConditions = template.conditions.map(c => ({
      ...c,
      id: Math.random().toString(36).substring(7)
    }));
    setActiveConditions(newConditions);
  };

  // Add condition manually
  const addCondition = (condition: Omit<QueryCondition, 'id'>) => {
    const newCondition: QueryCondition = {
      ...condition,
      id: Math.random().toString(36).substring(7)
    };
    setActiveConditions(prev => [...prev, newCondition]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Remove condition
  const removeCondition = (id: string) => {
    setActiveConditions(prev => prev.filter(c => c.id !== id));
  };

  // Clear all conditions
  const clearAll = () => {
    setActiveConditions([]);
    setSearchQuery('');
  };

  // Get suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const allSuggestions = Object.values(AUTO_COMPLETE_SUGGESTIONS).flat();
    
    return allSuggestions.filter(s => 
      s.text.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Quick Templates */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 text-neutral-500" />
        <span className="text-xs text-neutral-500 font-medium">Quick Filters:</span>
        {QUERY_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs transition-colors group"
            title={template.description}
          >
            {template.icon}
            <span>{template.name}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Try: magnitude > 3.0, felt by people, within 10 miles..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07]"
          />
        </div>

        {/* Auto-complete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => addCondition({
                  ...suggestion.query,
                  label: suggestion.text
                } as Omit<QueryCondition, 'id'>)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Conditions */}
      {activeConditions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-500">Active filters:</span>
          {activeConditions.map(condition => (
            <div
              key={condition.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs"
            >
              <span>{condition.label}</span>
              <button
                onClick={() => removeCondition(condition.id)}
                className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-neutral-400">
          Found <span className="text-white font-medium">{filteredEarthquakes.length}</span> earthquakes
          {activeConditions.length > 0 && (
            <span className="text-neutral-500"> matching your filters</span>
          )}
        </div>
        
        <button
          onClick={() => setShowFacets(!showFacets)}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          {showFacets ? 'Hide' : 'Show'} Facets
        </button>
      </div>

      {/* Facets Panel */}
      {showFacets && facets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {facets.map(facet => (
            <FacetPanel
              key={facet.id}
              facet={facet}
              onToggle={(value) => {
                // Convert facet selection to condition
                // This is a simplified version - in real implementation,
                // you'd parse the facet value to create proper conditions
                console.log('Facet toggled:', facet.id, value);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Facet Panel Component
function FacetPanel({ 
  facet, 
  onToggle 
}: { 
  facet: Facet; 
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(facet.expanded);

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          {facet.icon}
          <span className="text-sm font-medium">{facet.label}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
          {facet.options.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm hover:bg-white/[0.03] p-1.5 rounded cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => onToggle(option.value)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 checked:bg-blue-500 checked:border-blue-500"
              />
              <span className="flex-1 text-neutral-400 group-hover:text-white transition-colors">
                {option.label}
              </span>
              <span className="text-xs text-neutral-600">{option.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

