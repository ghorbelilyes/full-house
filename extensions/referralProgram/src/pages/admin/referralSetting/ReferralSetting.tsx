import { SettingMenu } from '@components/admin/SettingMenu.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Users, Save, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

/* ── Types ── */
interface ReferralSettingsData {
  enabled: boolean;
  title: string;
  description: string;
  referrerRewardType: string;
  referrerRewardValue: number;
  referredRewardType: string;
  referredRewardValue: number;
  minOrderAmount: number;
  rewardTrigger: string;
  couponExpiryDays: number;
  maxReferrals: number;
  allowGuestTracking: boolean;
  requireNewCustomer: boolean;
  preventSelfReferral: boolean;
  cookieDurationDays: number;
  whatsappTemplate: string;
  termsText: string | null;
  enableInAccount: boolean;
  enableAfterCheckout: boolean;
}

/* ── Helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const selectCls = inputCls;

const REWARD_TYPES = [
  { value: 'percentage_discount', label: 'Réduction en %' },
  { value: 'fixed_discount', label: 'Réduction fixe' },
  { value: 'free_shipping', label: 'Livraison gratuite' },
  { value: 'none', label: 'Aucune' }
];

const TRIGGER_TYPES = [
  { value: 'account_creation', label: 'Création de compte' },
  { value: 'first_completed_order', label: 'Première commande terminée' },
  { value: 'first_paid_order', label: 'Première commande payée' },
  { value: 'first_delivered_order', label: 'Première commande livrée' }
];

/* ── Component ── */
export default function ReferralSetting({
  referralConfig,
  saveReferralSettingsApi
}: {
  referralConfig: { settings: ReferralSettingsData } | null;
  saveReferralSettingsApi: string;
}) {
  const initial = referralConfig?.settings;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [enabled, setEnabled] = useState(initial?.enabled || false);
  const [title, setTitle] = useState(initial?.title || 'Programme de parrainage');
  const [description, setDescription] = useState(initial?.description || 'Invitez vos amis et gagnez des récompenses');
  const [referrerRewardType, setReferrerRewardType] = useState(initial?.referrerRewardType || 'percentage_discount');
  const [referrerRewardValue, setReferrerRewardValue] = useState(initial?.referrerRewardValue || 10);
  const [referredRewardType, setReferredRewardType] = useState(initial?.referredRewardType || 'percentage_discount');
  const [referredRewardValue, setReferredRewardValue] = useState(initial?.referredRewardValue || 5);
  const [minOrderAmount, setMinOrderAmount] = useState(initial?.minOrderAmount || 0);
  const [rewardTrigger, setRewardTrigger] = useState(initial?.rewardTrigger || 'first_completed_order');
  const [couponExpiryDays, setCouponExpiryDays] = useState(initial?.couponExpiryDays || 30);
  const [maxReferrals, setMaxReferrals] = useState(initial?.maxReferrals || 50);
  const [allowGuestTracking, setAllowGuestTracking] = useState(initial?.allowGuestTracking ?? true);
  const [requireNewCustomer, setRequireNewCustomer] = useState(initial?.requireNewCustomer ?? true);
  const [preventSelfReferral, setPreventSelfReferral] = useState(initial?.preventSelfReferral ?? true);
  const [cookieDurationDays, setCookieDurationDays] = useState(initial?.cookieDurationDays || 30);
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    initial?.whatsappTemplate || 'Découvrez notre boutique ! Utilisez mon lien de parrainage pour une remise : {link}'
  );
  const [termsText, setTermsText] = useState(initial?.termsText || '');
  const [enableInAccount, setEnableInAccount] = useState(initial?.enableInAccount ?? true);
  const [enableAfterCheckout, setEnableAfterCheckout] = useState(initial?.enableAfterCheckout || false);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(saveReferralSettingsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          settings: {
            ref_enabled: enabled ? '1' : '0',
            ref_title: title,
            ref_description: description,
            ref_referrer_reward_type: referrerRewardType,
            ref_referrer_reward_value: String(referrerRewardValue),
            ref_referred_reward_type: referredRewardType,
            ref_referred_reward_value: String(referredRewardValue),
            ref_min_order_amount: String(minOrderAmount),
            ref_reward_trigger: rewardTrigger,
            ref_coupon_expiry_days: String(couponExpiryDays),
            ref_max_referrals: String(maxReferrals),
            ref_allow_guest_tracking: allowGuestTracking ? '1' : '0',
            ref_require_new_customer: requireNewCustomer ? '1' : '0',
            ref_prevent_self_referral: preventSelfReferral ? '1' : '0',
            ref_cookie_duration_days: String(cookieDurationDays),
            ref_whatsapp_template: whatsappTemplate,
            ref_terms_text: termsText,
            ref_enable_in_account: enableInAccount ? '1' : '0',
            ref_enable_after_checkout: enableAfterCheckout ? '1' : '0'
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Configuration sauvegardée.' });
      } else {
        setMessage({ type: 'error', text: json.error?.message || 'Erreur.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-1 lg:col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Parrainage
                </span>
              </CardTitle>
              <CardDescription>
                Configurez le programme de parrainage client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {message && (
                <div className={`rounded-md px-3 py-2 text-sm ${
                  message.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-destructive/10 text-destructive'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Enable */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold">Activer le programme de parrainage</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Permettre aux clients de parrainer leurs amis
                  </div>
                </div>
                <div
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>

              {/* General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Titre du programme">
                  <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field label="Description">
                  <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </div>

              {/* Referrer reward */}
              <div className="p-4 rounded-lg border border-border space-y-4">
                <h3 className="text-sm font-semibold">Récompense pour le parrain</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type de récompense">
                    <select className={selectCls} value={referrerRewardType} onChange={(e) => setReferrerRewardType(e.target.value)}>
                      {REWARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  {referrerRewardType !== 'none' && referrerRewardType !== 'free_shipping' && (
                    <Field label="Valeur">
                      <input type="number" step="0.01" className={inputCls} value={referrerRewardValue} onChange={(e) => setReferrerRewardValue(parseFloat(e.target.value) || 0)} />
                    </Field>
                  )}
                </div>
              </div>

              {/* Referred reward */}
              <div className="p-4 rounded-lg border border-border space-y-4">
                <h3 className="text-sm font-semibold">Récompense pour le filleul</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type de récompense">
                    <select className={selectCls} value={referredRewardType} onChange={(e) => setReferredRewardType(e.target.value)}>
                      {REWARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  {referredRewardType !== 'none' && referredRewardType !== 'free_shipping' && (
                    <Field label="Valeur">
                      <input type="number" step="0.01" className={inputCls} value={referredRewardValue} onChange={(e) => setReferredRewardValue(parseFloat(e.target.value) || 0)} />
                    </Field>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Montant min. de commande">
                  <input type="number" step="0.01" className={inputCls} value={minOrderAmount} onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Récompenser après">
                  <select className={selectCls} value={rewardTrigger} onChange={(e) => setRewardTrigger(e.target.value)}>
                    {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Expiration coupon (jours)">
                  <input type="number" className={inputCls} value={couponExpiryDays} onChange={(e) => setCouponExpiryDays(parseInt(e.target.value, 10) || 30)} />
                </Field>
                <Field label="Max parrainages par client">
                  <input type="number" className={inputCls} value={maxReferrals} onChange={(e) => setMaxReferrals(parseInt(e.target.value, 10) || 50)} />
                </Field>
                <Field label="Durée cookie (jours)">
                  <input type="number" className={inputCls} value={cookieDurationDays} onChange={(e) => setCookieDurationDays(parseInt(e.target.value, 10) || 30)} />
                </Field>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Tracking invités">
                  <select className={selectCls} value={allowGuestTracking ? '1' : '0'} onChange={(e) => setAllowGuestTracking(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
                <Field label="Filleul nouveau client">
                  <select className={selectCls} value={requireNewCustomer ? '1' : '0'} onChange={(e) => setRequireNewCustomer(e.target.value === '1')}>
                    <option value="1">Obligatoire</option>
                    <option value="0">Non requis</option>
                  </select>
                </Field>
                <Field label="Empêcher auto-parrainage">
                  <select className={selectCls} value={preventSelfReferral ? '1' : '0'} onChange={(e) => setPreventSelfReferral(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
              </div>

              {/* Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Afficher dans le compte client">
                  <select className={selectCls} value={enableInAccount ? '1' : '0'} onChange={(e) => setEnableInAccount(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
                <Field label="Afficher après le checkout">
                  <select className={selectCls} value={enableAfterCheckout ? '1' : '0'} onChange={(e) => setEnableAfterCheckout(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
              </div>

              {/* WhatsApp template */}
              <Field label="Message WhatsApp de partage">
                <textarea
                  className={inputCls + ' min-h-[80px]'}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  placeholder="Utilisez {link} pour le lien de parrainage"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Utilisez <code>{'{link}'}</code> pour insérer le lien de parrainage.
                </p>
              </Field>

              {/* Terms */}
              <Field label="Conditions d'utilisation">
                <textarea className={inputCls + ' min-h-[60px]'} value={termsText} onChange={(e) => setTermsText(e.target.value)} placeholder="Texte des conditions..." />
              </Field>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    referralConfig {
      settings {
        enabled
        title
        description
        referrerRewardType
        referrerRewardValue
        referredRewardType
        referredRewardValue
        minOrderAmount
        rewardTrigger
        couponExpiryDays
        maxReferrals
        allowGuestTracking
        requireNewCustomer
        preventSelfReferral
        cookieDurationDays
        whatsappTemplate
        termsText
        enableInAccount
        enableAfterCheckout
      }
    }
    saveReferralSettingsApi: url(routeId: "saveReferralSettings")
  }
`;
