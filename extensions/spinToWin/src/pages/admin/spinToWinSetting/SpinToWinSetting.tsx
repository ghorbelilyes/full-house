import { SettingMenu } from '@components/admin/SettingMenu.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Dices, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react';
import React, { useState } from 'react';

/* ── Types ── */
interface RewardRow {
  label: string;
  reward_type: string;
  value: number;
  probability: number;
  coupon_prefix: string;
  coupon_expiry_days: number;
  min_order_amount: number;
  max_usage: number;
  active: boolean;
}

interface SettingsData {
  enabled: boolean;
  popupTitle: string;
  popupSubtitle: string;
  buttonText: string;
  successMessage: string;
  failureMessage: string;
  triggerType: string;
  triggerDelay: number;
  showOnPages: string[];
  inputRequired: string;
  allowGuest: boolean;
  requireLogin: boolean;
  maxSpinsVisitor: number;
  maxSpinsCustomer: number;
  cooldown: string;
  mainColor: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  wheelColors: string[];
  soundEnabled: boolean;
  confettiEnabled: boolean;
  termsText: string | null;
}

interface ConfigData {
  settings: SettingsData;
  rewards: RewardRow[];
}

/* ── Input helpers ── */
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
  { value: 'gift_product', label: 'Cadeau surprise' },
  { value: 'no_win', label: 'Pas de gain' }
];

const TRIGGER_TYPES = [
  { value: 'delay', label: 'Après X secondes' },
  { value: 'exit_intent', label: 'Intention de quitter' },
  { value: 'scroll', label: 'Après défilement' },
  { value: 'manual', label: 'Bouton uniquement' }
];

const COOLDOWN_OPTS = [
  { value: 'once_per_session', label: 'Une fois par session' },
  { value: 'once_per_day', label: 'Une fois par jour' },
  { value: 'once_per_week', label: 'Une fois par semaine' },
  { value: 'once_forever', label: 'Une seule fois' }
];

const INPUT_OPTS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'email_or_phone', label: 'Email ou téléphone' },
  { value: 'none', label: 'Aucun' }
];

const PAGE_OPTS = [
  { value: 'homepage', label: 'Accueil' },
  { value: 'productView', label: 'Page produit' },
  { value: 'categoryView', label: 'Page catégorie' },
  { value: 'cart', label: 'Panier' },
  { value: 'checkout', label: 'Checkout' }
];

/* ── Default reward row ── */
const newReward = (): RewardRow => ({
  label: '',
  reward_type: 'no_win',
  value: 0,
  probability: 0,
  coupon_prefix: '',
  coupon_expiry_days: 30,
  min_order_amount: 0,
  max_usage: 1,
  active: true
});

/* ── Main Component ── */
export default function SpinToWinSetting({
  spinToWinConfig,
  saveSpinToWinSettingsApi
}: {
  spinToWinConfig: ConfigData | null;
  saveSpinToWinSettingsApi: string;
}) {
  const initial = spinToWinConfig?.settings;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [enabled, setEnabled] = useState(initial?.enabled || false);
  const [popupTitle, setPopupTitle] = useState(initial?.popupTitle || 'Tentez votre chance');
  const [popupSubtitle, setPopupSubtitle] = useState(initial?.popupSubtitle || 'Tournez la roue et gagnez une remise');
  const [buttonText, setButtonText] = useState(initial?.buttonText || 'Tourner la roue');
  const [successMessage, setSuccessMessage] = useState(initial?.successMessage || 'Félicitations !');
  const [failureMessage, setFailureMessage] = useState(initial?.failureMessage || 'Essayez encore');
  const [triggerType, setTriggerType] = useState(initial?.triggerType || 'delay');
  const [triggerDelay, setTriggerDelay] = useState(initial?.triggerDelay || 5);
  const [showOnPages, setShowOnPages] = useState<string[]>(initial?.showOnPages || ['homepage', 'productView', 'categoryView']);
  const [inputRequired, setInputRequired] = useState(initial?.inputRequired || 'email');
  const [allowGuest, setAllowGuest] = useState(initial?.allowGuest ?? true);
  const [requireLogin, setRequireLogin] = useState(initial?.requireLogin || false);
  const [maxSpinsVisitor, setMaxSpinsVisitor] = useState(initial?.maxSpinsVisitor || 1);
  const [maxSpinsCustomer, setMaxSpinsCustomer] = useState(initial?.maxSpinsCustomer || 3);
  const [cooldown, setCooldown] = useState(initial?.cooldown || 'once_forever');
  const [mainColor, setMainColor] = useState(initial?.mainColor || '#e11d48');
  const [bgColor, setBgColor] = useState(initial?.bgColor || '#ffffff');
  const [textColor, setTextColor] = useState(initial?.textColor || '#1e293b');
  const [buttonColor, setButtonColor] = useState(initial?.buttonColor || '#e11d48');
  const [wheelColors, setWheelColors] = useState<string[]>(initial?.wheelColors || ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']);
  const [soundEnabled, setSoundEnabled] = useState(initial?.soundEnabled ?? true);
  const [confettiEnabled, setConfettiEnabled] = useState(initial?.confettiEnabled ?? true);
  const [termsText, setTermsText] = useState(initial?.termsText || '');

  // Rewards state
  const [rewards, setRewards] = useState<RewardRow[]>(
    spinToWinConfig?.rewards?.length
      ? spinToWinConfig.rewards.map((r) => ({
          label: r.label,
          reward_type: r.reward_type || r.rewardType,
          value: r.value,
          probability: r.probability,
          coupon_prefix: r.coupon_prefix || r.couponPrefix || '',
          coupon_expiry_days: r.coupon_expiry_days || r.couponExpiryDays || 30,
          min_order_amount: r.min_order_amount || r.minOrderAmount || 0,
          max_usage: r.max_usage || r.maxUsage || 1,
          active: r.active !== false
        }))
      : [newReward()]
  );

  const totalProb = rewards
    .filter((r) => r.active)
    .reduce((s, r) => s + (parseFloat(String(r.probability)) || 0), 0);

  const updateReward = (idx: number, field: string, val: any) => {
    setRewards((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const togglePage = (page: string) => {
    setShowOnPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(saveSpinToWinSettingsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          settings: {
            stw_enabled: enabled ? '1' : '0',
            stw_popup_title: popupTitle,
            stw_popup_subtitle: popupSubtitle,
            stw_button_text: buttonText,
            stw_success_message: successMessage,
            stw_failure_message: failureMessage,
            stw_trigger_type: triggerType,
            stw_trigger_delay: String(triggerDelay),
            stw_show_on_pages: JSON.stringify(showOnPages),
            stw_input_required: inputRequired,
            stw_allow_guest: allowGuest ? '1' : '0',
            stw_require_login: requireLogin ? '1' : '0',
            stw_max_spins_visitor: String(maxSpinsVisitor),
            stw_max_spins_customer: String(maxSpinsCustomer),
            stw_cooldown: cooldown,
            stw_main_color: mainColor,
            stw_bg_color: bgColor,
            stw_text_color: textColor,
            stw_button_color: buttonColor,
            stw_wheel_colors: JSON.stringify(wheelColors),
            stw_sound_enabled: soundEnabled ? '1' : '0',
            stw_confetti_enabled: confettiEnabled ? '1' : '0',
            stw_terms_text: termsText
          },
          rewards
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
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Dices className="h-5 w-5" />
                  Roue de chance
                </span>
              </CardTitle>
              <CardDescription>
                Configurez la popup roue de chance pour vos visiteurs.
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

              {/* Enable/disable */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="text-sm font-semibold">Activer la roue de chance</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Afficher la popup sur le site
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

              {/* Popup text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Titre de la popup">
                  <input className={inputCls} value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} />
                </Field>
                <Field label="Sous-titre">
                  <input className={inputCls} value={popupSubtitle} onChange={(e) => setPopupSubtitle(e.target.value)} />
                </Field>
                <Field label="Texte du bouton">
                  <input className={inputCls} value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                </Field>
                <Field label="Message de succès">
                  <input className={inputCls} value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} />
                </Field>
                <Field label="Message d'échec">
                  <input className={inputCls} value={failureMessage} onChange={(e) => setFailureMessage(e.target.value)} />
                </Field>
              </div>

              {/* Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type de déclenchement">
                  <select className={selectCls} value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
                    {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                {triggerType === 'delay' && (
                  <Field label="Délai (secondes)">
                    <input type="number" className={inputCls} value={triggerDelay} onChange={(e) => setTriggerDelay(parseInt(e.target.value, 10) || 0)} />
                  </Field>
                )}
              </div>

              {/* Pages */}
              <Field label="Afficher sur les pages">
                <div className="flex flex-wrap gap-2 mt-1">
                  {PAGE_OPTS.map((p) => (
                    <label key={p.value} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                      showOnPages.includes(p.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                    }`}>
                      <input type="checkbox" className="hidden" checked={showOnPages.includes(p.value)} onChange={() => togglePage(p.value)} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </Field>

              {/* Input / Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Donnée requise du visiteur">
                  <select className={selectCls} value={inputRequired} onChange={(e) => setInputRequired(e.target.value)}>
                    {INPUT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Période de cooldown">
                  <select className={selectCls} value={cooldown} onChange={(e) => setCooldown(e.target.value)}>
                    {COOLDOWN_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Max tours par visiteur">
                  <input type="number" className={inputCls} min={1} value={maxSpinsVisitor} onChange={(e) => setMaxSpinsVisitor(parseInt(e.target.value, 10) || 1)} />
                </Field>
                <Field label="Max tours par client">
                  <input type="number" className={inputCls} min={1} value={maxSpinsCustomer} onChange={(e) => setMaxSpinsCustomer(parseInt(e.target.value, 10) || 1)} />
                </Field>
                <Field label="Autoriser les invités">
                  <select className={selectCls} value={allowGuest ? '1' : '0'} onChange={(e) => setAllowGuest(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
                <Field label="Connexion obligatoire">
                  <select className={selectCls} value={requireLogin ? '1' : '0'} onChange={(e) => setRequireLogin(e.target.value === '1')}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </Field>
              </div>

              {/* Design */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Couleur principale">
                  <input type="color" className="w-full h-10 rounded-md border border-border cursor-pointer" value={mainColor} onChange={(e) => setMainColor(e.target.value)} />
                </Field>
                <Field label="Fond">
                  <input type="color" className="w-full h-10 rounded-md border border-border cursor-pointer" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                </Field>
                <Field label="Texte">
                  <input type="color" className="w-full h-10 rounded-md border border-border cursor-pointer" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </Field>
                <Field label="Bouton">
                  <input type="color" className="w-full h-10 rounded-md border border-border cursor-pointer" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} />
                </Field>
              </div>

              {/* Extras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Effets sonores">
                  <select className={selectCls} value={soundEnabled ? '1' : '0'} onChange={(e) => setSoundEnabled(e.target.value === '1')}>
                    <option value="1">Activé</option>
                    <option value="0">Désactivé</option>
                  </select>
                </Field>
                <Field label="Confetti">
                  <select className={selectCls} value={confettiEnabled ? '1' : '0'} onChange={(e) => setConfettiEnabled(e.target.value === '1')}>
                    <option value="1">Activé</option>
                    <option value="0">Désactivé</option>
                  </select>
                </Field>
              </div>

              <Field label="Conditions d'utilisation">
                <textarea className={inputCls + ' min-h-[80px]'} value={termsText} onChange={(e) => setTermsText(e.target.value)} placeholder="Texte des conditions..." />
              </Field>
            </CardContent>
          </Card>

          {/* Rewards table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Segments de la roue</span>
                <button
                  onClick={() => setRewards((prev) => [...prev, newReward()])}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              </CardTitle>
              <CardDescription>
                La somme des probabilités des segments actifs doit être 100%.
                Actuel :{' '}
                <span className={totalProb >= 99.9 && totalProb <= 100.1 ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                  {totalProb.toFixed(1)}%
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards.map((r, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${r.active ? 'border-border' : 'border-border opacity-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <Field label="Label">
                        <input className={inputCls} value={r.label} onChange={(e) => updateReward(idx, 'label', e.target.value)} />
                      </Field>
                      <Field label="Type">
                        <select className={selectCls} value={r.reward_type} onChange={(e) => updateReward(idx, 'reward_type', e.target.value)}>
                          {REWARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Valeur">
                        <input type="number" step="0.01" className={inputCls} value={r.value} onChange={(e) => updateReward(idx, 'value', parseFloat(e.target.value) || 0)} />
                      </Field>
                      <Field label="Probabilité %">
                        <input type="number" step="0.1" min="0" max="100" className={inputCls} value={r.probability} onChange={(e) => updateReward(idx, 'probability', parseFloat(e.target.value) || 0)} />
                      </Field>
                      <Field label="Préfixe coupon">
                        <input className={inputCls} value={r.coupon_prefix} onChange={(e) => updateReward(idx, 'coupon_prefix', e.target.value)} />
                      </Field>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input type="checkbox" checked={r.active} onChange={(e) => updateReward(idx, 'active', e.target.checked)} className="accent-primary" />
                          Actif
                        </label>
                        <button
                          onClick={() => setRewards((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {r.reward_type !== 'no_win' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                        <Field label="Expiration (jours)">
                          <input type="number" className={inputCls} value={r.coupon_expiry_days} onChange={(e) => updateReward(idx, 'coupon_expiry_days', parseInt(e.target.value, 10) || 30)} />
                        </Field>
                        <Field label="Commande min.">
                          <input type="number" step="0.01" className={inputCls} value={r.min_order_amount} onChange={(e) => updateReward(idx, 'min_order_amount', parseFloat(e.target.value) || 0)} />
                        </Field>
                        <Field label="Utilisation max.">
                          <input type="number" className={inputCls} value={r.max_usage} onChange={(e) => updateReward(idx, 'max_usage', parseInt(e.target.value, 10) || 1)} />
                        </Field>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
    spinToWinConfig {
      settings {
        enabled
        popupTitle
        popupSubtitle
        buttonText
        successMessage
        failureMessage
        triggerType
        triggerDelay
        showOnPages
        inputRequired
        allowGuest
        requireLogin
        maxSpinsVisitor
        maxSpinsCustomer
        cooldown
        mainColor
        bgColor
        textColor
        buttonColor
        wheelColors
        soundEnabled
        confettiEnabled
        termsText
      }
      rewards {
        rewardId
        label
        rewardType
        value
        probability
        couponPrefix
        couponExpiryDays
        minOrderAmount
        maxUsage
        active
        sortOrder
      }
    }
    saveSpinToWinSettingsApi: url(routeId: "saveSpinToWinSettings")
  }
`;
