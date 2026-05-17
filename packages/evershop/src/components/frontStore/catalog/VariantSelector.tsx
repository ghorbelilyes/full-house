import { useAppDispatch, useAppState } from '@components/common/context/app.js';
import {
  DefaultVariantAttribute,
  DefaultVariantOptionItem
} from '@components/frontStore/catalog/DefaultVariantSelectorRender.js';
import {
  useProduct,
  VariantAttribute,
  VariantGroup,
  AttributeOption
} from '@components/frontStore/catalog/ProductContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useEffect, useMemo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

interface SelectedOption {
  attributeCode: string;
  optionId: number;
}

interface ProcessedAttribute extends VariantAttribute {
  selected: boolean;
  selectedOption: number | null;
  options: (AttributeOption & { available: boolean })[];
}

/**
 * Parse selected options from the current URL query params.
 * Accepts either a full URL string or a URLSearchParams-style source.
 */
const getSelectedOptionsFromUrl = (
  attributes: VariantAttribute[],
  currentUrl: string
): SelectedOption[] => {
  const url = new URL(currentUrl);
  const selected: SelectedOption[] = [];

  for (const attribute of attributes) {
    const paramValue = url.searchParams.get(attribute.attributeCode);
    if (paramValue) {
      const optionId = parseInt(paramValue, 10);
      if (!Number.isNaN(optionId)) {
        const optionExists = attribute.options.some(
          (o) => o.optionId === optionId
        );
        if (optionExists) {
          selected.push({ attributeCode: attribute.attributeCode, optionId });
        }
      }
    }
  }

  return selected;
};

/**
 * Check if at least one variant exists whose attributes are a superset of the
 * given terms.  A variant matches when ALL terms are found among its
 * attributes.
 */
const variantExists = (
  vs: VariantGroup,
  terms: SelectedOption[]
): boolean => {
  if (terms.length === 0) return true;
  return vs.items.some((item) =>
    terms.every((term) =>
      item.attributes.some(
        (attr) =>
          attr.attributeCode === term.attributeCode &&
          attr.optionId != null &&
          parseInt(attr.optionId.toString(), 10) === term.optionId
      )
    )
  );
};

/**
 * Process attributes to determine:
 * - Which option is selected for each attribute (from URL params)
 * - Which options are available (form valid combinations with current
 *   selections across ALL other variant groups)
 *
 * The algorithm is scalable to any number of variant groups:
 * for every option O in group G we build a candidate selection list that
 * contains the current selection from every OTHER group plus O, then
 * check whether any variant matches that full candidate list.
 */
const processAttributes = (
  vs: VariantGroup | undefined,
  attributes: VariantAttribute[],
  currentUrl: string
): ProcessedAttribute[] => {
  if (!vs || attributes.length === 0) return [];

  // Get currently selected options from URL
  const selectedOptions = getSelectedOptionsFromUrl(attributes, currentUrl);

  // Build processed attributes with selection state
  const processed: ProcessedAttribute[] = attributes.map((attribute) => {
    const selected = selectedOptions.find(
      (s) => s.attributeCode === attribute.attributeCode
    );

    // Selections from every OTHER group
    const otherSelections = selectedOptions.filter(
      (s) => s.attributeCode !== attribute.attributeCode
    );

    const options = attribute.options.map((option) => {
      // Build candidate terms: other-group selections + this candidate option
      const terms: SelectedOption[] = [
        ...otherSelections,
        {
          attributeCode: attribute.attributeCode,
          optionId: option.optionId
        }
      ];

      const available = variantExists(vs, terms);

      return {
        ...option,
        available
      };
    });

    return {
      ...attribute,
      selected: !!selected,
      selectedOption: selected ? selected.optionId : null,
      options
    };
  });

  return processed;
};

export interface VariantOptionItemProps {
  option: AttributeOption & { available: boolean };
  attribute: ProcessedAttribute;
  isSelected: boolean;
  onSelect: (attributeCode: string, optionId: number) => Promise<void>;
}

export interface VariantAttributeGroupProps {
  attribute: ProcessedAttribute;
  options: (AttributeOption & { available: boolean })[];
  onSelect: (attributeCode: string, optionId: number) => Promise<void>;
  OptionItem?: React.ComponentType<VariantOptionItemProps>;
}

interface VariantsProps {
  AttributeRenderer?: React.ComponentType<VariantAttributeGroupProps>;
  OptionRenderer?: React.ComponentType<VariantOptionItemProps>;
}

export function VariantSelector({
  AttributeRenderer = DefaultVariantAttribute,
  OptionRenderer = DefaultVariantOptionItem
}: VariantsProps) {
  const { variantGroup: vs, productId } = useProduct();
  const {
    config: {
      pageMeta: {
        route: { url: currentProductUrl }
      }
    }
  } = useAppState();
  const {
    register,
    formState: { errors }
  } = useFormContext();
  const AppContextDispatch = useAppDispatch();

  // Recompute processed attributes whenever the variant group data OR the
  // current URL (which carries the selected-option query params) changes.
  const computedAttributes = useMemo(
    () => processAttributes(vs, vs?.variantAttributes || [], currentProductUrl),
    [vs, currentProductUrl]
  );

  const [attributes, setAttributes] =
    React.useState<ProcessedAttribute[]>(computedAttributes);
  const attributeRef = React.useRef<ProcessedAttribute[]>(computedAttributes);

  const validate = useCallback(() => {
    return !attributeRef.current.find((a) => a.selected !== true);
  }, []);

  // Synchronise state whenever computed values change (variant data, URL, or
  // product switch).
  useEffect(() => {
    setAttributes(computedAttributes);
    attributeRef.current = computedAttributes;
  }, [computedAttributes]);

  const handleOptionClick = useCallback(
    async (attributeCode: string, optionId: number): Promise<void> => {
      const url = new URL(window.location.href);

      // Toggle behavior: if clicking the already selected option, deselect it
      const currentValue = url.searchParams.get(attributeCode);
      if (currentValue && parseInt(currentValue, 10) === optionId) {
        // Deselect: remove this param
        url.searchParams.delete(attributeCode);
      } else {
        // Select: set the param
        url.searchParams.set(attributeCode, optionId.toString());
      }

      url.searchParams.set('ajax', 'true');
      await AppContextDispatch.fetchPageData(url);
      url.searchParams.delete('ajax');

      history.pushState(null, '', url);
    },
    [AppContextDispatch]
  );

  if (!vs || attributes.length === 0) {
    return null;
  }

  return (
    <div className="variant variant__container grid grid-cols-1 gap-2 mt-5">
      {attributes.map((attribute) => {
        // Deduplicate options by optionId, keeping only those linked to a
        // real product (productId is truthy).
        const options = attribute.options.filter(
          (v, j, s) =>
            s.findIndex((o) => o.optionId === v.optionId) === j && v.productId
        );

        return (
          <AttributeRenderer
            key={attribute.attributeCode}
            attribute={attribute}
            options={options}
            onSelect={handleOptionClick}
            OptionItem={OptionRenderer}
          />
        );
      })}
      <input
        type="hidden"
        {...register('variant_selected', {
          validate: validate
        })}
      />
      {errors.variant_selected && (
        <div className="text-destructive">
          {_('Please select variant options')}
        </div>
      )}
    </div>
  );
}
