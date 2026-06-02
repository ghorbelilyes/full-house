import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { GiftIcon } from 'lucide-react';
import React from 'react';

interface CouponMenuGroupProps {
  couponGrid: string;
}

export default function CatalogMenuGroup({ couponGrid }: CouponMenuGroupProps) {
  if (!useModuleEnabled('coupons')) return null;
  const safeCouponUrl = couponGrid.includes('/admin/coupons')
    ? couponGrid
    : '/admin/coupons';

  return (
    <NavigationItemGroup
      id="couponMenuGroup"
      name="Promotions"
      items={[
        {
          Icon: GiftIcon,
          url: safeCouponUrl,
          title: 'Coupons'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 50
};

export const query = `
  query Query {
    couponGrid: url(routeId:"couponGrid")
  }
`;
