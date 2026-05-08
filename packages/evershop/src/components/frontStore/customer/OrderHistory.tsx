import { Image } from '@components/common/Image.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import {
  Order,
  useCustomer
} from '@components/frontStore/customer/CustomerContext.jsx';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

const OrderDetail: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
      {/* Order header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {_('Order')}
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">
            #{order.orderNumber}
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
            {order.createdAt.text}
          </span>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800">
            {_('Paid')}
          </span>

          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
            {_('Total')}: {order.grandTotal.text}
          </span>
        </div>
      </div>

      {/* Order items */}
      <div className="space-y-4">
        {order.items.map((item) => (
          <div
            className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            key={item.productSku}
          >
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-3 dark:bg-slate-700">
              {item.thumbnail ? (
                <Image
                  width={50}
                  height={50}
                  style={{ maxWidth: '6rem' }}
                  src={item.thumbnail}
                  alt={item.productName}
                  className="max-h-full object-contain"
                />
              ) : (
                <ProductNoThumbnail width={50} height={50} />
              )}
            </div>

            <div className="flex-1">
              <h4 className="font-bold leading-snug text-slate-950 dark:text-white">
                {item.productName}
              </h4>
              <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">
                {_('Sku')}: #{item.productSku}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {item.qty} × {item.productPrice.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default function OrderHistory({ title }: { title?: string }) {
  const { customer } = useCustomer();
  const orders = customer?.orders || [];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-700">
        <div>
          {title && (
            <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
              {title}
            </h2>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {_('Your latest orders placed on the shop.')}
          </p>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12 px-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-3 text-3xl">📦</div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {_('You have not placed any orders yet')}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <OrderDetail order={order} key={order.orderId} />
        ))}
      </div>
    </div>
  );
}
