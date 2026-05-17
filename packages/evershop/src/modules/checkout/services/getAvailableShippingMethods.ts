import { select } from '@evershop/postgres-query-builder';
import axios from 'axios';
import { normalizePort } from '../../../bin/lib/normalizePort.js';
import { pool } from '../../../lib/postgres/connection.js';
import { buildUrl } from '../../../lib/router/buildUrl.js';
import { toPrice } from './toPrice.js';

export const getAvailableShippingMethods = async (
  cartId: string,
  country?: string,
  province?: string,
  postcode?: string
) => {
  const cart = await select()
    .from('cart')
    .where('uuid', '=', cartId)
    .and('status', '=', 't')
    .load(pool);
  if (!cart) {
    throw new Error('Cart not found');
  }

  const shippingAddress = await select()
    .from('cart_address')
    .where('cart_address_id', '=', cart.shipping_address_id)
    .load(pool);

  if (!country && !shippingAddress?.country) {
    return [];
  }

  const zoneQuery = select().from('shipping_zone');
  zoneQuery
    .leftJoin('shipping_zone_province')
    .on(
      'shipping_zone_province.zone_id',
      '=',
      'shipping_zone.shipping_zone_id'
    );
  if (province || shippingAddress?.province) {
    zoneQuery
      .where(
        'shipping_zone_province.province',
        '=',
        province || shippingAddress?.province
      )
      .or('shipping_zone_province.province', 'IS NULL', null);
  } else {
    zoneQuery.where('shipping_zone_province.province', 'IS NULL', null);
  }

  zoneQuery.andWhere(
    'shipping_zone.country',
    '=',
    country || shippingAddress?.country
  );

  const zone = await zoneQuery.load(pool);
  if (!zone) {
    return [];
  }

  const methodsQuery = select().from('shipping_method');
  methodsQuery
    .leftJoin('shipping_zone_method')
    .on(
      'shipping_zone_method.method_id',
      '=',
      'shipping_method.shipping_method_id'
    );
  methodsQuery
    .where('shipping_zone_method.zone_id', '=', zone.shipping_zone_id)
    .and('shipping_zone_method.is_enabled', '=', 't');
  let methods = await methodsQuery.execute(pool);

  methods = methods.filter((method) => {
    if (!method.condition_type) {
      return true;
    }
    if (method.condition_type === 'price') {
      return (
        toPrice(method.min) <= cart.sub_total &&
        cart.sub_total <= toPrice(method.max)
      );
    } else if (method.condition_type === 'weight') {
      return (
        toPrice(method.min) <= cart.total_weight &&
        cart.total_weight <= toPrice(method.max)
      );
    } else {
      return false;
    }
  });

  // Loop through the methods and calculate the cost
  methods = await Promise.all(
    methods.map(async (method) => {
      if (method.calculate_api) {
        // This API is internal. It must be public
        const port = normalizePort();
        let api = `http://localhost:${port}`;
        try {
          api += buildUrl(method.calculate_api, {
            cart_id: cart.uuid,
            method_id: method.uuid
          });
        } catch (e) {
          throw new Error(
            `Your shipping calculate API ${method.calculate_api} is invalid`
          );
        }
        const jsonResponse = await axios.get(api);
        // Detect if the API returns an error base on the http status
        if (jsonResponse.status >= 400) {
          throw new Error(
            `Error calculating shipping cost for method ${method.name}`
          );
        }
        return {
          ...method,
          cost: toPrice(jsonResponse.data.data.cost, false)
        };
      } else if (method.weight_based_cost) {
        const totalWeight = cart.total_weight;
        const weightBasedCost = method.weight_based_cost
          .map(({ min_weight, cost }) => ({
            min_weight: parseFloat(min_weight),
            cost: toPrice(cost)
          }))
          .sort((a, b) => a.min_weight - b.min_weight);

        let matchedTier = null;
        for (let i = 0; i < weightBasedCost.length; i += 1) {
          if (totalWeight >= weightBasedCost[i].min_weight) {
            matchedTier = weightBasedCost[i];
          }
        }
        // If the cart weight does not meet any tier's min_weight,
        // exclude this method from available shipping methods
        if (matchedTier === null) {
          return null;
        }
        return {
          ...method,
          cost: toPrice(matchedTier.cost.toString(), false)
        };
      } else if (method.price_based_cost) {
        const subTotal = toPrice(cart.sub_total);
        const priceBasedCost = method.price_based_cost
          .map(({ min_price, cost }) => ({
            min_price: toPrice(min_price),
            cost: toPrice(cost)
          }))
          .sort((a, b) => a.min_price - b.min_price);
        // Find the last tier whose min_price the cart subtotal meets
        let matchedTier = null;
        for (let i = 0; i < priceBasedCost.length; i += 1) {
          if (subTotal >= priceBasedCost[i].min_price) {
            matchedTier = priceBasedCost[i];
          }
        }
        // If the cart subtotal does not meet any tier's min_price,
        // exclude this method from available shipping methods
        if (matchedTier === null) {
          return null;
        }
        return {
          ...method,
          cost: toPrice(matchedTier.cost.toString(), false)
        };
      } else {
        return {
          ...method,
          cost: toPrice(method.cost.toString(), false)
        };
      }
    })
  );

  // Filter out methods that were excluded (returned null) due to
  // unmet tier conditions (price_based_cost / weight_based_cost)
  return methods
    .filter((method) => method !== null)
    .map((method) => ({
      id: method.uuid,
      code: method.uuid,
      name: method.name,
      cost: method.cost
    }));
};
