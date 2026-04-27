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
import React, { useEffect, useMemo } from 'react';
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
 * Parse selected options from the current URL query params
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
      const optionExists = attribute.options.some(
        (o) => o.optionId === optionId
      );
      if (optionExists) {
        selected.push({ attributeCode: attribute.attributeCode, optionId });
      }
    }
  }

  return selected;
};

/**
 * Check if a variant exists matching a given set of attribute selections.
 * A variant matches if ALL the given terms are present in its attributes.
 */
const variantExists = (
  vs: VariantGroup,
  terms: SelectedOption[]
): boolean => {
  return vs.items.some((item) =>
    terms.every((term) =>
      item.attributes.some(
        (attr) =>
          attr.attributeCode === term.attributeCode &&
          parseInt(attr.optionId.toString(), 10) === term.optionId
      )
    )
  );
};

/**
 * Process attributes to determine:
 * - Which option is selected for each attribute (from URL params)
 * - Which options are available (form valid combinations with current selections)
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
  let processed: ProcessedAttribute[] = attributes.map((attribute) => {
    const selected = selectedOptions.find(
      (s) => s.attributeCode === attribute.attributeCode
    );
    return {
      ...attribute,
      selected: !!selected,
      selectedOption: selected ? selected.optionId : null
    } as ProcessedAttribute;
  });

  // Calculate availability for each option in each attribute group
  processed = processed.map((attribute) => {
    const options = attribute.options.map((option) => {
      // Build the terms: all OTHER selected attributes + this candidate option
      const terms: SelectedOption[] = selectedOptions
        .filter((s) => s.attributeCode !== attribute.attributeCode)
        .concat({
          attributeCode: attribute.attributeCode,
          optionId: option.optionId
        });

      const available = variantExists(vs, terms);

      return {
        ...option,
        available
      };
    });

    return { ...attribute, options };
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

  const initialAttributes = useMemo(
    () => processAttributes(vs, vs?.variantAttributes || [], currentProductUrl),
    [vs, currentProductUrl]
  );

  const [attributes, setAttributes] =
    React.useState<ProcessedAttribute[]>(initialAttributes);
  const attributeRef = React.useRef<ProcessedAttribute[]>(initialAttributes);

  const validate = () => {
    return !attributeRef.current.find((a) => a.selected !== true);
  };

  useEffect(() => {
    const handleProductChange = () => {
      const newAttributes = processAttributes(
        vs,
        vs?.variantAttributes || [],
        currentProductUrl
      );
      setAttributes(newAttributes);
      attributeRef.current = newAttributes;
    };

    handleProductChange();
  }, [vs, productId]);

  const handleOptionClick = async (
    attributeCode: string,
    optionId: number
  ): Promise<void> => {
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
  };

  if (!vs || attributes.length === 0) {
    return null;
  }

  return (
    <div className="variant variant__container grid grid-cols-1 gap-2 mt-5">
      {attributes.map((attribute) => {
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
