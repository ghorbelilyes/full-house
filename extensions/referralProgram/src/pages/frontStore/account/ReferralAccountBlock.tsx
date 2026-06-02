/**
 * ReferralAccountBlock — shows referral info in the customer account page.
 * Wrapped in ModuleGate. Only visible when referralProgram module is enabled.
 */
import { ModuleGate } from '@components/common/modules/ModuleGate.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Gift, Clock, Award } from 'lucide-react';

interface ReferralData {
  code: string;
  referralLink: string;
  invitedCount: number;
  validatedCount: number;
  availableRewards: number;
  usedRewards: number;
  pendingRewards: number;
  whatsappTemplate: string;
}

function ReferralBlock() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/referral/stats', { credentials: 'same-origin' });
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        } else {
          setError(json.error?.message || '');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCopy = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const template = data.whatsappTemplate || '{link}';
    const message = template.replace('{link}', data.referralLink);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 p-6 mt-10">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <section className="mt-10">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {_('Mon parrainage')}
              </h2>
              <p className="text-sm text-gray-500">
                {_('Invitez vos amis et gagnez des récompenses')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Referral link */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {_('Votre lien de parrainage')}
            </label>
            <div className="mt-2 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={data.referralLink}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-700 pr-10"
                />
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                title={_('Copier le lien')}
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? '✓' : _('Copier le lien')}
              </button>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                title={_('Partager sur WhatsApp')}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{_('Partager sur WhatsApp')}</span>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Code :</span>
              <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {data.code}
              </code>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label={_('Amis invités')}
              value={data.invitedCount}
              color="blue"
            />
            <StatCard
              icon={<Check className="w-4 h-4" />}
              label={_('Parrainages validés')}
              value={data.validatedCount}
              color="green"
            />
            <StatCard
              icon={<Gift className="w-4 h-4" />}
              label={_('Récompenses disponibles')}
              value={data.availableRewards}
              color="purple"
            />
            <StatCard
              icon={<Award className="w-4 h-4" />}
              label={_('Récompenses utilisées')}
              value={data.usedRewards}
              color="gray"
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label={_('En attente')}
              value={data.pendingRewards}
              color="amber"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  const cls = colorMap[color] || colorMap.gray;

  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${cls} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

/* ── Exported wrapped component ── */
export default function ReferralAccountBlock() {
  return (
    <ModuleGate module="referralProgram">
      <ReferralBlock />
    </ModuleGate>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 50
};
