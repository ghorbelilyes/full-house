import { Image } from '@components/common/Image.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Search, X, Loader2 } from 'lucide-react';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useClient } from 'urql';

const SEARCH_PRODUCTS_QUERY = `
  query Query($filters: [FilterInput]) {
    products(filters: $filters) {
      items {
        ...Product
      }
    }
  }
`;

const PRODUCT_FRAGMENT = `
  fragment Product on Product {
    productId
    name
    sku
    price {
      regular {
        value
        text
      }
      special {
        value
        text
      }
    }
    image {
      url
      alt
    }
    url
  }
`;

export interface SearchResult {
  id: string;
  title: string;
  url?: string;
  image?: string;
  price?: string;
  type?: 'product' | 'category' | 'page';
  [key: string]: unknown;
}

interface SearchBoxProps {
  searchPageUrl: string;
  enableAutocomplete?: boolean;
  autocompleteDelay?: number;
  minSearchLength?: number;
  maxResults?: number;
}

export function SearchBox({
  searchPageUrl,
  enableAutocomplete = false,
  autocompleteDelay = 300,
  minSearchLength = 2,
  maxResults = 10
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const client = useClient();

  const [keyword, setKeyword] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('keyword');
    if (key) setKeyword(key);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      if (!enableAutocomplete || query.length < minSearchLength) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await client
          .query(
            `${PRODUCT_FRAGMENT}\n${SEARCH_PRODUCTS_QUERY}`,
            {
              filters: [
                { key: 'keyword', operation: 'eq', value: query },
                { key: 'limit', operation: 'eq', value: `${maxResults}` }
              ]
            }
          )
          .toPromise();

        if (result.error || !result.data?.products?.items) {
          setSearchResults([]);
        } else {
          setSearchResults(
            result.data.products.items.map((product: any) => ({
              id: product.productId,
              title: product.name,
              url: product.url,
              image: product.image?.url,
              price: product.price?.special?.text || product.price?.regular?.text,
              type: 'product' as const
            }))
          );
        }
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [enableAutocomplete, client, minSearchLength, maxResults]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setKeyword(value);
      if (enableAutocomplete) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
          performSearch(value);
        }, autocompleteDelay);
      }
    },
    [enableAutocomplete, autocompleteDelay, performSearch]
  );

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      setShowResults(false);
      if (result.url) {
        window.location.href = result.url;
      } else {
        const url = new URL(searchPageUrl, window.location.origin);
        url.searchParams.set('keyword', result.title);
        window.location.href = url.toString();
      }
    },
    [searchPageUrl]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        setShowResults(false);
        const url = new URL(searchPageUrl, window.location.origin);
        url.searchParams.set('keyword', keyword);
        window.location.href = url.toString();
      }
    },
    [searchPageUrl, keyword]
  );

  const handleFocus = useCallback(() => {
    if (enableAutocomplete && keyword.length >= minSearchLength) {
      if (searchResults.length > 0) {
        setShowResults(true);
      } else {
        performSearch(keyword);
      }
    }
  }, [enableAutocomplete, keyword, minSearchLength, searchResults.length, performSearch]);

  return (
    <div className="search-container" ref={containerRef}>
      {/* Search input — styled by Header.scss */}
      <div className="search-input-wrapper">
        <Search className="search-input-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={_('Rechercher des produits...')}
          value={keyword}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoComplete="off"
        />
        {keyword && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setKeyword('');
              setSearchResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown results — styled by Header.scss */}
      {enableAutocomplete && showResults && (
        <div className="search-dropdown">
          {isSearching && (
            <div className="search-dropdown__status">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {_('Recherche en cours...')}
              </span>
            </div>
          )}
          {!isSearching && searchResults.length === 0 && keyword.length >= minSearchLength && (
            <div className="search-dropdown__status">
              {_('Aucun produit trouvé')}
            </div>
          )}
          {!isSearching &&
            searchResults.map((result) => (
              <a
                key={result.id}
                href={result.url || '#'}
                className="search-dropdown__item"
                onClick={(e) => {
                  e.preventDefault();
                  handleResultSelect(result);
                }}
              >
                {result.image && (
                  <Image
                    src={result.image}
                    alt={result.title}
                    width={56}
                    height={56}
                    className="search-dropdown__img"
                  />
                )}
                <div className="search-dropdown__info">
                  <div className="search-dropdown__name">
                    {result.title}
                  </div>
                  {result.price && (
                    <div className="search-dropdown__price">
                      {result.price}
                    </div>
                  )}
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
