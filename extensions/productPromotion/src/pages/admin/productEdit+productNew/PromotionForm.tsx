// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

export default function PromotionForm({ product, setting }) {
  const promo = product?.promotionAdmin;
  const [enabled, setEnabled] = useState(promo?.enabled ?? false);
  const [promoType, setPromoType] = useState(promo?.promotionType ?? 'percentage');
  const [promoValue, setPromoValue] = useState(promo?.promotionValue ?? 0);
  const [label, setLabel] = useState(promo?.promotionLabel ?? '');
  const [startDate, setStartDate] = useState(promo?.startDate ?? '');
  const [endDate, setEndDate] = useState(promo?.endDate ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const price = product?.price?.regular?.value ?? 0;
  const currency = setting?.storeCurrency || 'USD';

  // Compute preview
  let previewPrice = price;
  let savedAmount = 0;
  if (enabled && promoValue > 0) {
    if (promoType === 'percentage') {
      savedAmount = (price * promoValue) / 100;
    } else {
      savedAmount = Math.min(promoValue, price);
    }
    previewPrice = Math.max(0, price - savedAmount);
  }

  const handleSave = async () => {
    if (!product?.productId) {
      setMessage('Please save the product first before adding a promotion.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/products/${product.productId}/promotion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            promotion_type: promoType,
            promotion_value: promoValue,
            promotion_label: label || null,
            start_date: startDate || null,
            end_date: endDate || null,
            enabled
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage('Promotion saved successfully!');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to save promotion');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to save promotion');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!product?.productId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/products/${product.productId}/promotion`,
        {
          method: 'DELETE',
          credentials: 'same-origin'
        }
      );
      const data = await res.json();
      if (data.success) {
        setEnabled(false);
        setPromoValue(0);
        setLabel('');
        setStartDate('');
        setEndDate('');
        setMessage('Promotion removed');
        setMessageType('success');
      }
    } catch (err) {
      setMessage('Failed to remove promotion');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏷️ {_('Product Promotion')}
          </span>
        </CardTitle>
        <CardDescription className="">
          {_('Set a discount promotion for this product. Supports percentage or fixed amount discounts.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <div className="flex flex-col gap-4">
          {/* Enable toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#e48125'
                }}
              />
              <span className="font-medium">{_('Enable Promotion')}</span>
            </label>
          </div>

          {enabled && (
            <>
              {/* Promotion type and value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {_('Discount Type')}
                  </label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full border border-border rounded px-3 py-2 bg-background"
                  >
                    <option value="percentage">{_('Percentage (%)')}</option>
                    <option value="fixed">{_('Fixed Amount')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {_('Discount Value')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={promoType === 'percentage' ? 100 : undefined}
                      step="0.01"
                      value={promoValue}
                      onChange={(e) =>
                        setPromoValue(parseFloat(e.target.value) || 0)
                      }
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
                    >
                      {promoType === 'percentage' ? '%' : currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {_('Promotion Label')}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({_('optional, shown on storefront badge')})
                  </span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={
                    promoType === 'percentage'
                      ? `-${promoValue}%`
                      : `-${promoValue} ${currency}`
                  }
                  className="w-full border border-border rounded px-3 py-2 bg-background"
                />
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {_('Start Date')}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({_('optional')})
                    </span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-border rounded px-3 py-2 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {_('End Date')}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({_('optional')})
                    </span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-border rounded px-3 py-2 bg-background"
                  />
                </div>
              </div>

              {/* Price preview */}
              <div
                className="rounded-lg p-4 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  border: '1px solid #fed7aa'
                }}
              >
                <div className="text-sm font-medium mb-2" style={{ color: '#9a4b0f' }}>
                  {_('Price Preview')}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{_('Original:')}</span>
                    <span className="ml-1 line-through text-muted-foreground">
                      {price.toFixed(2)} {currency}
                    </span>
                  </div>
                  <span style={{ color: '#e48125', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    →
                  </span>
                  <div>
                    <span className="text-sm" style={{ color: '#9a4b0f' }}>
                      {_('Final:')}
                    </span>
                    <span
                      className="ml-1 text-lg font-bold"
                      style={{ color: '#e48125' }}
                    >
                      {previewPrice.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div
                    className="ml-auto px-3 py-1 rounded-full text-white text-sm font-bold"
                    style={{ background: '#e48125' }}
                  >
                    {label ||
                      (promoType === 'percentage'
                        ? `-${promoValue}%`
                        : `-${promoValue} ${currency}`)}
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: '#9a4b0f' }}>
                  {_('You save')}: {savedAmount.toFixed(2)} {currency}
                  {promoType === 'percentage' && ` (${promoValue}%)`}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <Button
              className=""
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              isLoading={saving}
              disabled={saving}
            >
              {saving ? _('Saving...') : _('Save Promotion')}
            </Button>
            {promo && (
              <Button
                className=""
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove();
                }}
                disabled={saving}
              >
                {_('Remove Promotion')}
              </Button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className="text-sm px-3 py-2 rounded"
              style={{
                color: messageType === 'success' ? '#065f46' : '#9a4b0f',
                background:
                  messageType === 'success' ? '#d1fae5' : '#ffedd5'
              }}
            >
              {message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      productId
      price {
        regular {
          value
          text
        }
      }
      promotionAdmin {
        productPromotionId
        promotionType
        promotionValue
        promotionLabel
        startDate
        endDate
        enabled
      }
    }
    setting {
      storeCurrency
    }
  }
`;
