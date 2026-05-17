/* eslint-disable react/prop-types */
import { useAppDispatch } from '@components/common/context/app.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@components/common/ui/Select.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { cn } from '@evershop/evershop/lib/util/cn';
import React, { useCallback } from 'react';

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

  const currentPreset = sortPresets.find((p) => p.key === currentKey) || null;

  const applySort = useCallback(
    async (preset: SortPreset | null) => {
      if (disabled || !preset) return;
      setCurrentKey(preset.key);

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
        'mb-8 flex items-center justify-between border-b border-slate-200 pb-5',
        'hidden lg:flex'
      )}
    >
      <p className="text-sm font-medium text-slate-600">
        {_('${count} Products', {
          count: count.toString()
        })}
      </p>
      <div className={cn('product-sorting flex gap-3 items-center', className)}>
        <div className="sort-select grow">
          <Select
            value={currentPreset}
            onValueChange={(value: SortPreset | null) => applySort(value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={_('Sort By')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{_('Sort By')}</SelectLabel>
                {sortPresets.map((preset) => (
                  <SelectItem key={preset.key} value={preset}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
