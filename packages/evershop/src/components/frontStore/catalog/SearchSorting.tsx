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
import { useSearch } from '@components/frontStore/catalog/SearchContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useState, useCallback } from 'react';

export interface SortPreset {
  key: string;
  label: string;
  ob: string;
  od: string;
}

export const searchSortPresets: SortPreset[] = [
  { key: 'price_asc', label: _('Prix croissant'), ob: 'price', od: 'asc' },
  { key: 'price_desc', label: _('Prix décroissant'), ob: 'price', od: 'desc' },
  { key: 'promo', label: _('Promo d\'abord'), ob: 'promo', od: 'asc' },
  { key: 'review', label: _('Pertinence (avis)'), ob: 'review', od: 'desc' },
  { key: 'name_asc', label: _('Nom, A à Z'), ob: 'name', od: 'asc' },
  { key: 'name_desc', label: _('Nom, Z à A'), ob: 'name', od: 'desc' }
];

export function getCurrentPresetKey(): string {
  if (typeof window === 'undefined') return '';
  const params = new URL(document.location.href).searchParams;
  const ob = params.get('ob') || '';
  const od = params.get('od') || 'asc';
  const match = searchSortPresets.find((p) => p.ob === ob && p.od === od);
  return match ? match.key : '';
}

export function SearchSorting() {
  const { products } = useSearch();
  const AppContextDispatch = useAppDispatch();
  const [currentKey, setCurrentKey] = useState(getCurrentPresetKey);

  const applySort = useCallback(
    async (preset: SortPreset | null) => {
      if (!preset) return;
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
    [AppContextDispatch]
  );

  const currentPreset = searchSortPresets.find((p) => p.key === currentKey) || null;

  return (
    <div className="hidden lg:flex mb-8 items-center justify-between border-b border-slate-200 pb-5">
      <p className="text-sm font-medium text-slate-600">
        {_('${count} Products', { count: products.total.toString() })}
      </p>
      <div className="product-sorting flex gap-3 items-center">
        <div className="sort-select grow">
          <Select
            value={currentPreset}
            onValueChange={(value: SortPreset | null) => {
              if (value) applySort(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={_('Sort By')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{_('Sort By')}</SelectLabel>
                {searchSortPresets.map((preset) => (
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
