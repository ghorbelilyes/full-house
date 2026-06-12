 
import { useAppDispatch } from '@components/common/context/app.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { cn } from '@evershop/evershop/lib/util/cn';
import React, { useCallback, useState, useRef, useEffect } from 'react';

export interface SortPreset {
  key: string;
  label: string;
  ob: string;
  od: string;
}

interface ProductSortingProps {
  className?: string;
  disabled?: boolean;
  count: number;
}

const sortPresets: SortPreset[] = [
  { key: 'price_asc', label: _('Prix croissant'), ob: 'price', od: 'asc' },
  { key: 'price_desc', label: _('Prix décroissant'), ob: 'price', od: 'desc' },
  { key: 'promo', label: _('Promo d\'abord'), ob: 'promo', od: 'asc' },
  { key: 'review', label: _('Pertinence (avis)'), ob: 'review', od: 'desc' },
  { key: 'name_asc', label: _('Nom, A à Z'), ob: 'name', od: 'asc' },
  { key: 'name_desc', label: _('Nom, Z à A'), ob: 'name', od: 'desc' }
];

function getCurrentPresetKey(): string {
  if (typeof window === 'undefined') return '';
  const params = new URL(document.location.href).searchParams;
  const ob = params.get('ob') || '';
  const od = params.get('od') || 'asc';
  const match = sortPresets.find((p) => p.ob === ob && p.od === od);
  return match ? match.key : '';
}

export function ProductSorting({
  className = '',
  disabled = false,
  count
}: ProductSortingProps) {
  const AppContextDispatch = useAppDispatch();

  const [currentKey, setCurrentKey] = React.useState<string>(getCurrentPresetKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPreset = sortPresets.find((p) => p.key === currentKey) || null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applySort = useCallback(
    async (preset: SortPreset) => {
      if (disabled) return;
      setCurrentKey(preset.key);
      setDropdownOpen(false);

      const url = new URL(window.location.href, window.location.origin);
      if (preset.ob) {
        url.searchParams.set('ob', preset.ob);
      } else {
        url.searchParams.delete('ob');
      }
      if (preset.od && preset.od !== 'asc') {
        url.searchParams.set('od', preset.od);
      } else {
        url.searchParams.delete('od');
      }
      url.searchParams.delete('page');
      url.searchParams.append('ajax', 'true');
      await AppContextDispatch.fetchPageData(url);
      url.searchParams.delete('ajax');
      history.pushState(null, '', url);
    },
    [AppContextDispatch, disabled]
  );

  return (
    <div
      className={cn(
        'mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm',
        'hidden lg:flex'
      )}
    >
      {/* Product count */}
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{count}</span>{' '}
        {count === 1 ? _('product') : _('products')}
      </p>

      {/* Sort dropdown */}
      <div className={cn('relative', className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150',
            dropdownOpen
              ? 'border-primary bg-brand-soft text-primary'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {/* ArrowUpDown icon */}
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 16-4 4-4-4" />
            <path d="M17 20V4" />
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
          </svg>
          <span>{currentPreset ? currentPreset.label : _('Sort By')}</span>
          {/* Chevron */}
          <svg
            className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
            {sortPresets.map((preset) => {
              const isActive = preset.key === currentKey;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applySort(preset)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-brand-soft font-semibold text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  {/* Check icon for active */}
                  <span className={`flex h-4 w-4 items-center justify-center flex-shrink-0 ${isActive ? 'text-primary' : 'text-transparent'}`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
