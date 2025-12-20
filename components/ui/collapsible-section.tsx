'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
  headerClassName?: string;
  subtle?: boolean; // More minimal styling
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  className = '',
  headerClassName = '',
  subtle = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${subtle ? '' : 'card'} overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-colors ${
          subtle 
            ? 'py-3 text-neutral-400 hover:text-white' 
            : 'p-4 sm:p-5 hover:bg-white/[0.02]'
        } ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className={subtle ? 'text-neutral-500' : 'text-neutral-400'}>
              {icon}
            </span>
          )}
          <span className={`font-medium ${subtle ? 'text-sm' : 'text-white'}`}>
            {title}
          </span>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              subtle 
                ? 'bg-white/5 text-neutral-500' 
                : 'bg-white/10 text-neutral-400'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ease-out ${
            isOpen ? 'rotate-180' : ''
          } ${subtle ? 'text-neutral-600' : 'text-neutral-500'}`}
        />
      </button>
      
      <div 
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className={subtle ? 'pb-2' : 'p-4 sm:p-5 pt-0 border-t border-white/5'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

