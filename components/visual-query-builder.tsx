'use client';

import { useState } from 'react';
import { Plus, X, Save, Play } from 'lucide-react';
import { QueryCondition } from './earthquake-explorer';

interface VisualQueryBuilderProps {
  onBuildQuery: (conditions: Omit<QueryCondition, 'id'>[]) => void;
  onSaveQuery?: (name: string, conditions: Omit<QueryCondition, 'id'>[]) => void;
}

interface BuilderRow {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

const FIELD_OPTIONS = [
  { value: 'magnitude', label: 'Magnitude', operators: ['>', '>=', '<', '<=', 'between'] },
  { value: 'distance', label: 'Distance from me', operators: ['<', '<=', '>', '>='] },
  { value: 'felt', label: 'Felt by', operators: ['>', '>=', '<', '<='] },
  { value: 'depth', label: 'Depth', operators: ['<', '<=', '>', '>=', 'between'] },
  { value: 'time', label: 'Time ago', operators: ['<', '<='] },
];

const OPERATOR_LABELS: Record<string, string> = {
  '>': 'greater than',
  '>=': 'greater than or equal to',
  '<': 'less than',
  '<=': 'less than or equal to',
  'between': 'between',
  '=': 'equals',
};

export function VisualQueryBuilder({ onBuildQuery, onSaveQuery }: VisualQueryBuilderProps) {
  const [rows, setRows] = useState<BuilderRow[]>([
    { id: '1', field: 'magnitude', operator: '>', value: 3.0 }
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryName, setQueryName] = useState('');

  const addRow = () => {
    setRows([
      ...rows,
      { id: Math.random().toString(36).substring(7), field: 'magnitude', operator: '>', value: 2.0 }
    ]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<BuilderRow>) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const buildQuery = () => {
    const conditions = rows.map(row => {
      const field = FIELD_OPTIONS.find(f => f.value === row.field);
      const operatorLabel = OPERATOR_LABELS[row.operator];
      
      let label = `${field?.label || row.field} ${operatorLabel} ${row.value}`;
      
      // Add units
      if (row.field === 'distance') label += ' miles';
      if (row.field === 'depth') label += ' km';
      if (row.field === 'time') label += ' hours ago';
      if (row.field === 'felt') label += ' people';

      return {
        field: row.field as QueryCondition['field'],
        operator: row.operator as QueryCondition['operator'],
        value: row.value,
        label
      };
    });

    onBuildQuery(conditions);
  };

  const saveQuery = () => {
    if (!queryName.trim()) return;
    
    const conditions = rows.map(row => ({
      field: row.field as QueryCondition['field'],
      operator: row.operator as QueryCondition['operator'],
      value: row.value,
      label: `${row.field} ${row.operator} ${row.value}`
    }));

    onSaveQuery?.(queryName, conditions);
    setShowSaveDialog(false);
    setQueryName('');
  };

  return (
    <div className="space-y-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Build Your Search</h3>
        <div className="flex items-center gap-2">
          {onSaveQuery && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
          <button
            onClick={buildQuery}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Apply Filter
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-xs text-neutral-500 font-medium w-12">AND</span>
            )}
            {index === 0 && <div className="w-12" />}
            
            <div className="flex-1 grid grid-cols-3 gap-2">
              {/* Field Selector */}
              <select
                value={row.field}
                onChange={(e) => {
                  const newField = e.target.value;
                  const fieldOption = FIELD_OPTIONS.find(f => f.value === newField);
                  updateRow(row.id, { 
                    field: newField,
                    operator: fieldOption?.operators[0] || '>'
                  });
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
              >
                {FIELD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Operator Selector */}
              <select
                value={row.operator}
                onChange={(e) => updateRow(row.id, { operator: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
              >
                {FIELD_OPTIONS.find(f => f.value === row.field)?.operators.map(op => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </option>
                ))}
              </select>

              {/* Value Input */}
              <input
                type="number"
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: parseFloat(e.target.value) || 0 })}
                step={row.field === 'magnitude' ? '0.1' : '1'}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="Value"
              />
            </div>

            {rows.length > 1 && (
              <button
                onClick={() => removeRow(row.id)}
                className="p-2 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </button>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 max-w-md w-full space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Save Query</h3>
              <p className="text-sm text-neutral-400">
                Give your search a name so you can use it again later
              </p>
            </div>
            
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="e.g., Strong Events Near Me"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveQuery()}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuery}
                disabled={!queryName.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                Save Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

