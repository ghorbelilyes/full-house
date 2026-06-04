import { AddressSummary } from '@components/common/customer/address/AddressSummary.jsx';
import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { Form } from '@components/common/form/Form.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import {
  ExtendedCustomerAddress,
  useCustomer,
  useCustomerDispatch
} from '@components/frontStore/customer/CustomerContext.jsx';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { toast } from 'react-toastify';

const Address: React.FC<{
  address: ExtendedCustomerAddress;
}> = ({ address }) => {
  const { updateAddress, deleteAddress } = useCustomerDispatch();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="font-extrabold text-slate-950 dark:text-white">
            {address.fullName}
          </h3>
          <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            <AddressSummary address={address} />
          </div>
        </div>

        {address.isDefault && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
            {_('Default')}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {_('Edit')}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{_('Edit Address')}</DialogTitle>
            </DialogHeader>
            <Form
              id="customerAddressForm"
              method="PATCH"
              onSubmit={async (data) => {
                try {
                  await updateAddress(address.addressId, data);
                  setDialogOpen(false);
                  toast.success(_('Address has been updated successfully!'));
                } catch (error) {
                  toast.error(error.message);
                }
              }}
            >
              <CustomerAddressForm address={address} fieldNamePrefix="" />
              <div className="mt-3">
                <CheckboxField
                  label={_('Set as default')}
                  defaultChecked={address.isDefault}
                  name="is_default"
                />
              </div>
            </Form>
          </DialogContent>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await deleteAddress(address.addressId);
                  toast.success(_('Address has been deleted successfully!'));
                } catch (error) {
                  toast.error(error.message);
                }
              }}
            >
              {_('Delete')}
            </Button>
          </DialogFooter>
        </Dialog>

        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            try {
              await deleteAddress(address.addressId);
              toast.success(_('Address has been deleted successfully!'));
            } catch (error) {
              toast.error(error.message);
            }
          }}
          className="rounded-xl bg-brand-soft px-4 py-2 text-sm font-bold text-primary hover:bg-brand-soft dark:bg-brand-navy-soft/40 dark:text-primary dark:hover:bg-brand-navy-soft/60"
        >
          {_('Delete')}
        </button>
      </div>
    </article>
  );
};

export function MyAddresses({ title }: { title?: string }) {
  const { customer } = useCustomer();
  const { addAddress } = useCustomerDispatch();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  if (!customer) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700 sm:flex-row sm:items-center">
        <div>
          {title && (
            <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
              {title}
            </h2>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {_('Manage your shipping and billing addresses.')}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
              }}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {_('Add new address')}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{_('Add new address')}</DialogTitle>
            </DialogHeader>
            <Form
              id="customerAddressForm"
              method={'POST'}
              onSubmit={async (data) => {
                try {
                  await addAddress(data as ExtendedCustomerAddress);
                  setDialogOpen(false);
                  toast.success(_('Address has been saved successfully!'));
                } catch (error) {
                  toast.error(error.message);
                }
              }}
            >
              <CustomerAddressForm address={undefined} fieldNamePrefix="" />
              <div className="mt-3">
                <CheckboxField
                  label={_('Set as default')}
                  defaultChecked={false}
                  name="is_default"
                />
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses grid */}
      {customer.addresses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12 px-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-3 text-3xl">📍</div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {_('You have no addresses saved')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {customer.addresses.map((address) => (
          <Address key={address.uuid} address={address} />
        ))}
      </div>
    </div>
  );
}
