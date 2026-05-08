import Area from '@components/common/Area.js';
import {
  useCustomer,
  useCustomerDispatch
} from '@components/frontStore/customer/CustomerContext.jsx';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Mail, User } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';

interface AccountInfoProps {
  title?: string;
  showLogout?: boolean;
}
export default function AccountInfo({ title, showLogout }: AccountInfoProps) {
  const { customer: account } = useCustomer();
  const { logout } = useCustomerDispatch();
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-5 dark:border-slate-700">
        <div>
          {title && (
            <h2 className="text-2xl font-extrabold leading-tight text-slate-950 dark:text-white">
              {title}
            </h2>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {_('Your personal details.')}
          </p>
        </div>

        {showLogout && (
          <a
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              try {
                await logout();
                window.location.href = '/';
              } catch (error) {
                toast.error(error.message);
              }
            }}
          >
            {_('Logout')}
          </a>
        )}
      </div>

      {/* Details */}
      <div className="space-y-4">
        <Area
          id="accountDetails"
          coreComponents={[
            {
              component: {
                default: (
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500">
                      <User className="size-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {_('Name')}
                      </p>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {account?.fullName}
                      </p>
                    </div>
                  </div>
                )
              },
              sortOrder: 10
            },
            {
              component: {
                default: () => (
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500">
                      <Mail className="size-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {_('Email')}
                      </p>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {account?.email}
                      </p>
                    </div>
                  </div>
                )
              },
              sortOrder: 15
            }
          ]}
        />
      </div>
    </aside>
  );
}
