import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import { Package } from 'lucide-react';
import React from 'react';

export default function ModulesMenuItem({
  moduleManagerUrl
}: {
  moduleManagerUrl: string;
}) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(moduleManagerUrl, window.location.origin).pathname ===
      window.location.pathname;

  return (
    <Item
      variant="outline"
      className={cn(
        isActive && 'bg-primary/5 border-primary/20 dark:bg-primary/10'
      )}
      data-active={isActive ? 'true' : 'false'}
    >
      <ItemContent>
        <ItemTitle>
          <a
            href={moduleManagerUrl}
            className={cn(
              'uppercase text-xs font-semibold',
              isActive && 'text-primary'
            )}
          >
            Modules / Extensions
          </a>
        </ItemTitle>
        <ItemDescription>
          <div>Activer ou désactiver les modules du magasin</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = moduleManagerUrl)}
          title="Ouvrir"
        >
          <Package className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 5
};

export const query = `
  query Query {
    moduleManagerUrl: url(routeId: "moduleManager")
  }
`;
