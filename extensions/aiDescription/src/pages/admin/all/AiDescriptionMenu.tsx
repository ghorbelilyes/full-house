// @ts-nocheck
import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { Bot } from 'lucide-react';
import React from 'react';

export default function AiDescriptionMenu({ aiDescriptionSettingUrl }) {
  if (!useModuleEnabled('aiProductDescriptions')) return null;
  const isActive =
    typeof window !== 'undefined' &&
    new URL(aiDescriptionSettingUrl, window.location.origin).pathname ===
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
            href={aiDescriptionSettingUrl}
            className={cn(
              'uppercase text-xs font-semibold',
              isActive && 'text-primary'
            )}
          >
            IA description produit
          </a>
        </ItemTitle>
        <ItemDescription>
          <div>Clé API, modèle et génération des fiches produit</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = aiDescriptionSettingUrl)}
          title="Ouvrir"
        >
          <Bot className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 65
};

export const query = `
  query Query {
    aiDescriptionSettingUrl: url(routeId: "aiDescriptionSetting")
  }
`;
