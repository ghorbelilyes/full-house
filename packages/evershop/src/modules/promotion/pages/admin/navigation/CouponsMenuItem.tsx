import { NavigationItem } from '@components/admin/NavigationItem.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { Gift } from 'lucide-react';
import React from 'react';

interface CouponsMenuItemProps {
  url: string;
}

export default function CouponsMenuItem({ url }: CouponsMenuItemProps) {
  if (!useModuleEnabled('coupons')) return null;
  return <NavigationItem Icon={Gift} title="Coupons" url={url} />;
}
