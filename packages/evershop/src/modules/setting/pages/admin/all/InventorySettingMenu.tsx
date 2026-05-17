import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import { Package, Settings } from 'lucide-react';
import React from 'react';

interface InventorySettingMenuProps {
  inventorySettingUrl: string;
}

export default function InventorySettingMenu({
  inventorySettingUrl
}: InventorySettingMenuProps) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(inventorySettingUrl, window.location.origin).pathname ===
      window.location.pathname;

  return (
    <Item
      variant={'outline'}
      className={cn(
        isActive && 'bg-primary/5 border-primary/20 dark:bg-primary/10'
      )}
      data-active={isActive ? 'true' : 'false'}
    >
      <ItemContent>
        <ItemTitle>
          <div>
            <a
              href={inventorySettingUrl}
              className={cn(
                'uppercase text-xs font-semibold',
                isActive && 'text-primary'
              )}
            >
              Paramètres du Stock
            </a>
          </div>
        </ItemTitle>
        <ItemDescription>
          <div>Gérez les paramètres de stock et d'inventaire</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = inventorySettingUrl)}
        >
          <Settings className="h-4 w-4 mr-1" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 7
};

export const query = `
  query Query {
    inventorySettingUrl: url(routeId: "inventorySetting")
  }
`;
