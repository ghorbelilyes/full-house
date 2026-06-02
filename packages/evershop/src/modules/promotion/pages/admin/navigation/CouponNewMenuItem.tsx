import { NavigationItem } from '@components/admin/NavigationItem.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { Gift } from 'lucide-react';
import React from 'react';

interface CouponNewMenuItemProps {
  url: string;
}

export default function CouponNewMenuItem({ url }: CouponNewMenuItemProps) {
  if (!useModuleEnabled('coupons')) return null;
  return <NavigationItem Icon={Gift} title="New coupon" url={url} />;
}
