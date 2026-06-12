import Area from '@components/common/Area.js';
import { useSearch } from '@components/frontStore/catalog/SearchContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Search, Sparkles } from 'lucide-react';
import React from 'react';

export function SearchInfo() {
  const { keyword, products } = useSearch();
  const isPromotionPage = products.currentFilters.some(
    (filter) => filter.key === 'promo'
  );

  const heading = keyword
    ? _('Search results for "${keyword}"', { keyword })
    : isPromotionPage
    ? _('Promotions')
    : _('Shop');

  const subtext = keyword
    ? products.total > 0
      ? _('${count} results found', { count: products.total.toString() })
      : _('No results found')
    : isPromotionPage
    ? _('Discover our best deals and special offers')
    : _('Browse our full catalog');

  return (
    <>
      <Area id="searchInfoBefore" noOuter />
      <div className="page-width mb-8">
        <header className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary">
            {isPromotionPage ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {isPromotionPage ? _('Special Offers') : _('Search')}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl lg:text-4xl">
            {heading}
          </h1>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-primary" />
          <p className="mt-3 text-sm text-slate-500">
            {subtext}
          </p>
        </header>
      </div>
      <Area id="searchInfoAfter" noOuter />
    </>
  );
}
