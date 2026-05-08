import { Button } from '@components/common/ui/Button.js';
import { Checkbox } from '@components/common/ui/Checkbox.js';
import { Label } from '@components/common/ui/Label.js';
import {
  FilterableAttribute,
  FilterInput,
  useProductFilter
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useState } from 'react';

export const DefaultAttributeFilterRender: React.FC<{
  availableAttributes: FilterableAttribute[];
  currentFilters: FilterInput[];
}> = ({ availableAttributes, currentFilters }) => {
  const { updateFilter } = useProductFilter();
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [collapsedAttributes, setCollapsedAttributes] = useState<{
    [key: string]: boolean;
  }>({});

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

  const toggleCollapse = (attributeCode: string) => {
    setCollapsedAttributes((prev) => ({
      ...prev,
      [attributeCode]: !prev[attributeCode]
    }));
  };

  const clearAttributeFilter = (attributeCode: string) => {
    const newFilters = currentFilters.filter((f) => f.key !== attributeCode);
    updateFilter(newFilters);
  };

  return (
    <>
      {availableAttributes.map((attribute) => {
        const selectedCount = getSelectedCount(attribute.attributeCode);
        const filteredOptions = getFilteredOptions(attribute);
        const isCollapsed = collapsedAttributes[attribute.attributeCode];

        return (
          <div
            key={attribute.attributeCode}
            className="attribute__filter__section border-b border-slate-200 pb-3 mb-3 dark:border-slate-700"
          >
            <div className="filter__header flex items-center justify-between mb-2">
              <button
                onClick={() => toggleCollapse(attribute.attributeCode)}
                className="group flex flex-1 items-center justify-between rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{attribute.attributeName}</span>
                <div className="flex items-center gap-1.5">
                  {selectedCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-bold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                      {selectedCount}
                    </span>
                  )}
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {selectedCount > 0 && (
                <button
                  onClick={() => clearAttributeFilter(attribute.attributeCode)}
                  className="ml-2 text-xs text-slate-400 transition-colors hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400"
                  title={_('Clear')}
                >
                  ✕
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="filter__content">
                {attribute.options.length > 5 && (
                  <div className="mb-3">
                    <Checkbox
                      value={searchTerms[attribute.attributeCode] || ''}
                      onCheckedChange={(checked) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [attribute.attributeCode]: checked
                            ? checked.toString()
                            : ''
                        }))
                      }
                    />
                  </div>
                )}

                <div className="attribute__options space-y-2 max-h-48 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const isSelected = isOptionSelected(
                        attribute.attributeCode,
                        option.optionId.toString()
                      );
                      return (
                        <div
                          key={option.optionId}
                          className={`flex items-center space-x-2 cursor-pointer py-2`}
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
                          <Label
                            htmlFor={`${attribute.attributeCode}-${option.optionId}`}
                          >
                            {option.optionText}
                          </Label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-4">
                      {_('No options found for "${code}"', {
                        code: searchTerms[attribute.attributeCode]
                      })}
                    </div>
                  )}
                </div>

                {!searchTerms[attribute.attributeCode] &&
                  attribute.options.length > 10 && (
                    <Button
                      variant={'link'}
                      className="text-primary text-sm mt-2 hover:underline"
                    >
                      {_('Show all ${count} options', {
                        count: attribute.options.length.toString()
                      })}
                    </Button>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
