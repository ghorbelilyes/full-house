import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { Dices } from 'lucide-react';
import React from 'react';

interface Props {
  spinToWinSettingUrl: string;
}

export default function SpinToWinMenuItem({ spinToWinSettingUrl }: Props) {
  if (!useModuleEnabled('spinToWin')) return null;
  return (
    <NavigationItemGroup
      id="spinToWinMenuGroup"
      name="Marketing"
      items={[
        {
          Icon: Dices,
          url: spinToWinSettingUrl,
          title: 'Roue de chance'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 45
};

export const query = `
  query Query {
    spinToWinSettingUrl: url(routeId: "spinToWinSetting")
  }
`;
