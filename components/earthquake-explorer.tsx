'use client';

import { useState, useMemo, useEffect } from 'react';
import { Earthquake } from '@/lib/types';
import { 
  Search, 
  Filter, 
  X, 
  Sparkles,
  Clock,
  Zap,
  TrendingUp,
  Users,
  Layers
} from 'lucide-react';
import { useUnits, UnitSystem } from '@/lib/unit-context';
import { getDistanceUnitShort, formatDepth } from '@/lib/units';

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

// Helper to get distance unit label
function getDistanceLabel(value: number, unitSystem: UnitSystem): string {
  const unit = getDistanceUnitShort(unitSystem);
  return `${value} ${unit}`;
}

// Generate query templates based on unit system
function getQueryTemplates(unitSystem: UnitSystem): QueryTemplate[] {
  const distUnit = getDistanceUnitShort(unitSystem);
  return [
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
      description: `M3.0+ within 10 ${distUnit}`,
      conditions: [
        { field: 'magnitude', operator: '>=', value: 3.0, label: 'magnitude ≥ 3.0' },
        { field: 'distance', operator: '<=', value: 10, label: `within 10 ${distUnit}` }
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
      description: `Shallow earthquakes (${formatDepth(5, unitSystem)})`,
      conditions: [
        { field: 'depth', operator: '<', value: 5, label: `depth less than ${formatDepth(5, unitSystem)}` }
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
}

// Generate auto-complete suggestions based on unit system
function getAutoCompleteSuggestions(unitSystem: UnitSystem) {
  const distUnit = getDistanceUnitShort(unitSystem);
  return {
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
      { text: `within 5 ${distUnit}`, query: { field: 'distance', operator: '<=', value: 5 } },
      { text: `within 10 ${distUnit}`, query: { field: 'distance', operator: '<=', value: 10 } },
      { text: `within 25 ${distUnit}`, query: { field: 'distance', operator: '<=', value: 25 } },
      { text: `more than 25 ${distUnit} away`, query: { field: 'distance', operator: '>', value: 25 } },
    ],
    depth: [
      { text: `shallow depth (< ${formatDepth(5, unitSystem)})`, query: { field: 'depth', operator: '<', value: 5 } },
      { text: `moderate depth (${formatDepth(5, unitSystem)}-${formatDepth(15, unitSystem)})`, query: { field: 'depth', operator: 'between', value: [5, 15] } },
      { text: `deep (> ${formatDepth(15, unitSystem)})`, query: { field: 'depth', operator: '>', value: 15 } },
    ],
    time: [
      { text: 'in the last hour', query: { field: 'time', operator: '<=', value: 1 } },
      { text: 'in the last 24 hours', query: { field: 'time', operator: '<=', value: 24 } },
      { text: 'in the last week', query: { field: 'time', operator: '<=', value: 168 } },
      { text: 'in the last month', query: { field: 'time', operator: '<=', value: 720 } },
    ],
  };
}

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
  const { unitSystem } = useUnits();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeConditions, setActiveConditions] = useState<QueryCondition[]>([]);
  
  // Get unit-aware templates and suggestions
  const QUERY_TEMPLATES = useMemo(() => getQueryTemplates(unitSystem), [unitSystem]);
  const AUTO_COMPLETE_SUGGESTIONS = useMemo(() => getAutoCompleteSuggestions(unitSystem), [unitSystem]);

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
  useEffect(() => {
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
            placeholder={`Try: magnitude > 3.0, felt by people, within 10 ${getDistanceUnitShort(unitSystem)}...`}
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
      <div className="text-sm text-neutral-400">
        Found <span className="text-white font-medium">{filteredEarthquakes.length}</span> earthquakes
        {activeConditions.length > 0 && (
          <span className="text-neutral-500"> matching your filters</span>
        )}
      </div>
    </div>
  );
}
