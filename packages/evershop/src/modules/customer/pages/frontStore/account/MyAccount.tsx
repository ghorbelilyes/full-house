import Area from '@components/common/Area.js';
import AccountInfo from '@components/frontStore/customer/AccountInfo.js';
import { MyAddresses } from '@components/frontStore/customer/MyAddresses.js';
import OrderHistory from '@components/frontStore/customer/OrderHistory.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export default function MyAccount() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Page title */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {_('My Account')}
        </h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {_('Manage your orders, personal information and addresses.')}
        </p>
      </header>

      {/* Top dashboard: orders + account info */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <OrderHistory title={_('Recent Orders')} />
        <AccountInfo title={_('Account Information')} showLogout />
      </section>

      {/* Address book */}
      <section className="mt-10">
        <MyAddresses title={_('Address Book')} />
        <Area id="accountPageAddressBook" noOuter />
      </section>
    </main>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
