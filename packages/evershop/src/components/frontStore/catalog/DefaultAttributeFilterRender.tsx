import { Checkbox } from '@components/common/ui/Checkbox.js';
import { Label } from '@components/common/ui/Label.js';
import { DefaultFilterWrapperRender } from '@components/frontStore/catalog/DefaultFilterWrapperRender.js';
import {
  FilterableAttribute,
  FilterInput,
  useProductFilter
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';

export const DefaultAttributeFilterRender: React.FC<{
  availableAttributes: FilterableAttribute[];
  currentFilters: FilterInput[];
}> = ({ availableAttributes, currentFilters }) => {
  const { updateFilter } = useProductFilter();
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [expandedLists, setExpandedLists] = useState<{ [key: string]: boolean }>({});

  const handleAttributeChange = (
    attributeCode: string,
    optionId: string,
    checked: boolean
  ) => {
    let newFilters = [...currentFilters];
    const existingFilterIndex = newFilters.findIndex(
      (f) => f.key === attributeCode
    );

    if (checked) {
      if (existingFilterIndex !== -1) {
        const existingFilter = newFilters[existingFilterIndex];
        const values = existingFilter.value.split(',');
        if (!values.includes(optionId)) {
          values.push(optionId);
          newFilters[existingFilterIndex] = {
            ...existingFilter,
            value: values.join(',')
          };
        }
      } else {
        newFilters.push({
          key: attributeCode,
          operation: 'in',
          value: optionId
        });
      }
    } else if (existingFilterIndex !== -1) {
      const existingFilter = newFilters[existingFilterIndex];
      const values = existingFilter.value
        .split(',')
        .filter((v) => v !== optionId);
      if (values.length === 0) {
        newFilters = newFilters.filter((f) => f.key !== attributeCode);
      } else {
        newFilters[existingFilterIndex] = {
          ...existingFilter,
          value: values.join(',')
        };
      }
    }

    updateFilter(newFilters);
  };

  const isOptionSelected = (attributeCode: string, optionId: string) => {
    const filter = currentFilters.find((f) => f.key === attributeCode);
    return filter
      ? filter.value.split(',').includes(optionId.toString())
      : false;
  };

  const getSelectedCount = (attributeCode: string) => {
    const filter = currentFilters.find((f) => f.key === attributeCode);
    return filter ? filter.value.split(',').length : 0;
  };

  const getFilteredOptions = (attribute: FilterableAttribute) => {
    const searchTerm = searchTerms[attribute.attributeCode] || '';
    if (!searchTerm) return attribute.options;

    return attribute.options.filter((option) =>
      option.optionText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const clearAttributeFilter = (e: React.MouseEvent, attributeCode: string) => {
    e.stopPropagation();
    const newFilters = currentFilters.filter((f) => f.key !== attributeCode);
    updateFilter(newFilters);
  };

  const VISIBLE_LIMIT = 6;

  return (
    <>
      {availableAttributes.map((attribute) => {
        const selectedCount = getSelectedCount(attribute.attributeCode);
        const filteredOptions = getFilteredOptions(attribute);
        const isExpanded = expandedLists[attribute.attributeCode];
        const visibleOptions =
          isExpanded || filteredOptions.length <= VISIBLE_LIMIT
            ? filteredOptions
            : filteredOptions.slice(0, VISIBLE_LIMIT);
        const hasMore =
          !isExpanded && filteredOptions.length > VISIBLE_LIMIT;

        return (
          <DefaultFilterWrapperRender
            key={attribute.attributeCode}
            title={attribute.attributeName}
            badge={selectedCount}
          >
            <div>
              {/* Search within options */}
              {attribute.options.length > 6 && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={_('Search...')}
                    value={searchTerms[attribute.attributeCode] || ''}
                    onChange={(e) =>
                      setSearchTerms((prev) => ({
                        ...prev,
                        [attribute.attributeCode]: e.target.value
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  {searchTerms[attribute.attributeCode] && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [attribute.attributeCode]: ''
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Options list */}
              <div className="space-y-0.5 max-h-52 overflow-y-auto overscroll-contain pr-1">
                {visibleOptions.length > 0 ? (
                  visibleOptions.map((option) => {
                    const isSelected = isOptionSelected(
                      attribute.attributeCode,
                      option.optionId.toString()
                    );
                    return (
                      <label
                        key={option.optionId}
                        htmlFor={`${attribute.attributeCode}-${option.optionId}`}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'bg-brand-soft text-primary'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          id={`${attribute.attributeCode}-${option.optionId}`}
                          onCheckedChange={(checked) =>
                            handleAttributeChange(
                              attribute.attributeCode,
                              option.optionId.toString(),
                              checked
                            )
                          }
                        />
                        <span className="flex-1 text-[13px]">{option.optionText}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="py-3 text-center text-xs text-slate-400">
                    {_('No options found')}
                  </p>
                )}
              </div>

              {/* Show more / less */}
              {hasMore && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedLists((prev) => ({
                      ...prev,
                      [attribute.attributeCode]: true
                    }))
                  }
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  {_('Show all ${count} options', {
                    count: filteredOptions.length.toString()
                  })}
                </button>
              )}
              {isExpanded && filteredOptions.length > VISIBLE_LIMIT && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedLists((prev) => ({
                      ...prev,
                      [attribute.attributeCode]: false
                    }))
                  }
                  className="mt-2 text-xs font-medium text-slate-500 hover:text-primary hover:underline"
                >
                  {_('Show less')}
                </button>
              )}

              {/* Clear this attribute */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={(e) =>
                    clearAttributeFilter(e, attribute.attributeCode)
                  }
                  className="mt-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-red-500"
                >
                  {_('Clear')} ({selectedCount})
                </button>
              )}
            </div>
          </DefaultFilterWrapperRender>
        );
      })}
    </>
  );
};
