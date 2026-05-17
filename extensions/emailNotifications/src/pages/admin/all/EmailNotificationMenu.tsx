// @ts-nocheck
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
import { Mail } from 'lucide-react';

export default function EmailNotificationMenu({ emailNotificationSettingUrl }) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(emailNotificationSettingUrl, window.location.origin).pathname ===
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
            href={emailNotificationSettingUrl}
            className={cn(
              'uppercase text-xs font-semibold',
              isActive && 'text-primary'
            )}
          >
            Notifications email
          </a>
        </ItemTitle>
        <ItemDescription>
          <div>Configuration des emails transactionnels</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = emailNotificationSettingUrl)}
          title="Ouvrir"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 60
};

export const query = `
  query Query {
    emailNotificationSettingUrl: url(routeId: "emailNotificationSetting")
  }
`;
