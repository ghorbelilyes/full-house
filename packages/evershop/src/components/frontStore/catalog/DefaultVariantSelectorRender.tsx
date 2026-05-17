import { Button } from '@components/common/ui/Button.js';
import {
  VariantAttributeGroupProps,
  VariantOptionItemProps
} from '@components/frontStore/catalog/VariantSelector.js';
import React from 'react';

const DefaultVariantOptionItem: React.FC<VariantOptionItemProps> = ({
  option,
  attribute,
  isSelected,
  onSelect
}) => {
  // A selected option must never be disabled so the user can always toggle it
  // off (deselect).  Only mark an option as disabled when it is both
  // unavailable AND not currently selected.
  const isDisabled = option.available === false && !isSelected;

  return (
    <li
      key={option.optionId}
      className={`${isSelected ? 'selected' : ''} ${isDisabled ? 'un-available' : ''}`}
    >
      <Button
        variant={isSelected ? 'default' : 'outline'}
        disabled={isDisabled}
        onClick={async (e) => {
          e.preventDefault();
          if (isDisabled) return;
          await onSelect(attribute.attributeCode, option.optionId);
        }}
        className={`
          transition-all duration-200
          ${isSelected ? 'border-primary ring-2 ring-primary/30' : ''}
          ${isDisabled ? 'opacity-40 cursor-not-allowed line-through pointer-events-none' : 'cursor-pointer'}
        `.trim()}
        aria-pressed={isSelected}
        aria-disabled={isDisabled}
      >
        {option.optionText}
      </Button>
    </li>
  );
};

const DefaultVariantAttribute: React.FC<VariantAttributeGroupProps> = ({
  attribute,
  options,
  onSelect,
  OptionItem = DefaultVariantOptionItem
}) => {
  return (
    <div key={attribute.attributeCode}>
      <div className="mb-2 text-textSubdued uppercase">
        <span>{attribute.attributeName}</span>
        {attribute.selected && attribute.selectedOption !== null && (
          <span className="ml-2 text-foreground font-medium normal-case">
            {options.find((o) => o.optionId === attribute.selectedOption)
              ?.optionText || ''}
          </span>
        )}
      </div>
      <ul className="variant-option-list flex justify-start gap-2 flex-wrap">
        {options.map((option) => (
          <OptionItem
            key={option.optionId}
            option={option}
            attribute={attribute}
            isSelected={
              attribute.selected && attribute.selectedOption === option.optionId
            }
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
};

export { DefaultVariantAttribute, DefaultVariantOptionItem };
