import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { Users } from 'lucide-react';
import React from 'react';

interface Props {
  referralSettingUrl: string;
}

export default function ReferralMenuItem({ referralSettingUrl }: Props) {
  if (!useModuleEnabled('referralProgram')) return null;
  return (
    <NavigationItemGroup
      id="referralMenuGroup"
      name="Marketing"
      items={[
        {
          Icon: Users,
          url: referralSettingUrl,
          title: 'Parrainage'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 46
};

export const query = `
  query Query {
    referralSettingUrl: url(routeId: "referralSetting")
  }
`;
