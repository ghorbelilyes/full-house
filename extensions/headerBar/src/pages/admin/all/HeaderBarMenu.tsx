import React from 'react';
import { cn } from '@evershop/evershop/lib/util/cn';
import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { Settings } from 'lucide-react';

interface HeaderBarMenuProps {
  headerBarSettingUrl: string;
}

export default function HeaderBarMenu({ headerBarSettingUrl }: HeaderBarMenuProps) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(headerBarSettingUrl, window.location.origin).pathname ===
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
              href={headerBarSettingUrl}
              className={cn(
                'uppercase text-xs font-semibold',
                isActive && 'text-primary'
              )}
            >
              Barre d'annonce
            </a>
          </div>
        </ItemTitle>
        <ItemDescription>
          <div>Gérer la barre d'information en haut du site</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = headerBarSettingUrl)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 50
};

export const query = `
  query Query {
    headerBarSettingUrl: url(routeId: "headerBarSetting")
  }
`;
