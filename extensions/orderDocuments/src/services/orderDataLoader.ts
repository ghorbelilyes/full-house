import { select } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

export interface OrderAddress {
  order_address_id: number;
  full_name: string;
  telephone: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  postcode: string;
  country: string;
}

export interface OrderItem {
  order_item_id: number;
  product_sku: string;
  product_name: string;
  qty: number;
  product_price: number;
  product_price_incl_tax: number;
  final_price: number;
  final_price_incl_tax: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
  line_total_incl_tax: number;
  line_total_with_discount: number;
  line_total_with_discount_incl_tax: number;
  variant_options: string | null;
}

export interface OrderData {
  order_id: number;
  uuid: string;
  order_number: string;
  status: string;
  currency: string;
  customer_email: string;
  customer_full_name: string;
  coupon: string | null;
  shipping_fee_excl_tax: number;
  shipping_fee_incl_tax: number;
  discount_amount: number;
  sub_total: number;
  sub_total_incl_tax: number;
  sub_total_with_discount: number;
  sub_total_with_discount_incl_tax: number;
  total_qty: number;
  tax_amount: number;
  total_tax_amount: number;
  grand_total: number;
  shipping_method_name: string;
  payment_method_name: string;
  shipment_status: string;
  payment_status: string;
  shipping_note: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
}

export async function loadOrderData(orderUuid: string): Promise<OrderData | null> {
  const orderQuery = select();
  orderQuery.from('order');
  orderQuery.andWhere('order.uuid', '=', orderUuid);
  const order = await orderQuery.load(pool) as any;
  if (!order) return null;

  // Load items
  const itemsQuery = select();
  itemsQuery.from('order_item');
  itemsQuery.andWhere('order_item.order_item_order_id', '=', order.order_id);
  const items = await itemsQuery.execute(pool) as any[];

  // Load shipping address
  let shippingAddress: OrderAddress | null = null;
  if (order.shipping_address_id) {
    const addrQuery = select();
    addrQuery.from('order_address');
    addrQuery.andWhere('order_address.order_address_id', '=', order.shipping_address_id);
    shippingAddress = await addrQuery.load(pool) as any;
  }

  // Load billing address
  let billingAddress: OrderAddress | null = null;
  if (order.billing_address_id) {
    const addrQuery = select();
    addrQuery.from('order_address');
    addrQuery.andWhere('order_address.order_address_id', '=', order.billing_address_id);
    billingAddress = await addrQuery.load(pool) as any;
  }

  return {
    ...order,
    items: items || [],
    shippingAddress,
    billingAddress
  };
}
