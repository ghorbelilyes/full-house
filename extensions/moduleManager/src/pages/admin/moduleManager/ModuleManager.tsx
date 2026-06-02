import { SettingMenu } from '@components/admin/SettingMenu.js';
import { Badge } from '@components/common/ui/Badge.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  Lock,
  Unlock,
  Settings,
  Ticket,
  MessageCircle,
  Star,
  Heart,
  Bot,
  Package,
  Dices,
  Users
} from 'lucide-react';
import React, { useState } from 'react';

/* ── Icon map ── */
const ICONS: Record<string, React.ElementType> = {
  ticket: Ticket,
  messageCircle: MessageCircle,
  star: Star,
  heart: Heart,
  bot: Bot,
  dices: Dices,
  users: Users
};

/* ── Types ── */
interface ModuleDef {
  code: string;
  name: string;
  description: string;
  version: string;
  type: string;
  contractIncluded: boolean;
  enabled: boolean;
  locked: boolean;
  settingsRoute: string | null;
  icon: string;
}

interface ContractInfo {
  clientName: string;
  plan: string;
  expiresAt: string | null;
}

interface ModuleManagerProps {
  moduleManagerData: {
    contract: ContractInfo;
    modules: ModuleDef[];
  };
  saveModuleConfigApi: string;
}

/* ── Toggle switch ── */
function Toggle({
  checked,
  disabled,
  onChange
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : checked
            ? 'bg-green-500'
            : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </div>
  );
}

/* ── Main Component ── */
export default function ModuleManager({
  moduleManagerData,
  saveModuleConfigApi
}: ModuleManagerProps) {
  const { contract, modules: initialModules } = moduleManagerData;
  const [modules, setModules] = useState<ModuleDef[]>(initialModules);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleToggle = async (code: string, enabled: boolean) => {
    setSaving(code);
    setMessage(null);
    try {
      const res = await fetch(saveModuleConfigApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code, enabled })
      });
      const json = await res.json();
      if (json.success && json.data?.modules) {
        setModules(json.data.modules);
        setMessage({
          type: 'success',
          text: `Module « ${code} » ${enabled ? 'activé' : 'désactivé'} avec succès. Redémarrez le serveur pour appliquer les changements.`
        });
      } else {
        setMessage({
          type: 'error',
          text: json.error?.message || 'Erreur lors de la sauvegarde.'
        });
      }
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: e.message || 'Erreur réseau.'
      });
    } finally {
      setSaving(null);
    }
  };

  const enabledCount = modules.filter((m) => m.enabled).length;
  const lockedCount = modules.filter((m) => m.locked).length;

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Modules / Extensions
                </span>
              </CardTitle>
              <CardDescription>
                Gérez les modules activés pour ce magasin. Les modules verrouillés
                ne sont pas inclus dans votre contrat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Contract info */}
              <div className="flex items-center gap-4 rounded-lg border border-border p-4 mb-6 bg-muted/30">
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    Client : {contract.clientName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Plan : {contract.plan}
                    {contract.expiresAt &&
                      ` — Expire le ${new Date(contract.expiresAt).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge variant="default">
                    {enabledCount} activé{enabledCount > 1 ? 's' : ''}
                  </Badge>
                  {lockedCount > 0 && (
                    <Badge variant="warning">
                      {lockedCount} verrouillé{lockedCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`rounded-md px-3 py-2 text-sm mb-4 ${
                    message.type === 'success'
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Module list */}
              <div className="space-y-3">
                {modules.map((mod) => {
                  const IconComponent = ICONS[mod.icon] || Package;
                  const isSaving = saving === mod.code;

                  return (
                    <div
                      key={mod.code}
                      className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                        mod.locked
                          ? 'border-border bg-muted/20 opacity-60'
                          : mod.enabled
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-border bg-background'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          mod.locked
                            ? 'bg-gray-100 text-gray-400'
                            : mod.enabled
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {mod.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            v{mod.version}
                          </span>
                          {mod.type === 'core' && (
                            <Badge variant="secondary" className="text-[10px]">
                              Core
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {mod.description}
                        </p>
                      </div>

                      {/* Contract status */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {mod.locked ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Non inclus</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <Unlock className="h-3.5 w-3.5" />
                            <span>Inclus</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle */}
                      <div className="flex-shrink-0">
                        <Toggle
                          checked={mod.enabled}
                          disabled={mod.locked || isSaving}
                          onChange={(enabled) =>
                            handleToggle(mod.code, enabled)
                          }
                        />
                      </div>

                      {/* Settings link */}
                      <div className="flex-shrink-0 w-8">
                        {mod.settingsRoute && mod.enabled && !mod.locked && (
                          <a
                            href={`/admin/${mod.settingsRoute === 'couponGrid' ? 'coupons' : mod.settingsRoute === 'whatsappSetting' ? 'whatsapp-setting' : mod.settingsRoute === 'aiDescriptionSetting' ? 'setting/ai-description' : mod.settingsRoute === 'spinToWinSetting' ? 'setting/spin-to-win' : mod.settingsRoute === 'referralSetting' ? 'setting/referral' : mod.settingsRoute}`}
                            title="Configurer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Help text */}
              <div className="mt-6 p-3 rounded-md bg-muted/30 border border-border text-xs text-muted-foreground">
                <strong>Note :</strong> Après avoir modifié un module, un
                redémarrage du serveur est recommandé pour appliquer les changements
                côté backend (routes API, middleware). Les changements côté interface
                sont immédiats au prochain chargement de page.
              </div>
            </CardContent>
          </Card>
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
    moduleManagerData: moduleManager {
      contract {
        clientName
        plan
        expiresAt
      }
      modules {
        code
        name
        description
        version
        type
        contractIncluded
        enabled
        locked
        settingsRoute
        icon
      }
    }
    saveModuleConfigApi: url(routeId: "saveModuleConfig")
  }
`;
