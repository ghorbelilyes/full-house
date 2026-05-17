import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import { MessageCircle } from 'lucide-react';
import React from 'react';

interface WhatsAppSettingMenuProps {
  whatsappSettingUrl: string;
}

export default function WhatsAppSettingMenu({
  whatsappSettingUrl
}: WhatsAppSettingMenuProps) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(whatsappSettingUrl, window.location.origin).pathname ===
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
              href={whatsappSettingUrl}
              className={cn(
                'uppercase text-xs font-semibold',
                isActive && 'text-primary'
              )}
            >
              Paramètres WhatsApp
            </a>
          </div>
        </ItemTitle>
        <ItemDescription>
          <div>Configurez la commande via WhatsApp</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = whatsappSettingUrl)}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
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
    whatsappSettingUrl: url(routeId: "whatsappSetting")
  }
`;
