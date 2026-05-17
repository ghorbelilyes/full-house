import { SettingMenu } from '@components/admin/SettingMenu.js';
import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React, { useState } from 'react';

interface WhatsAppSettingProps {
  saveSettingApi: string;
  setting: {
    whatsappEnabled: boolean;
    whatsappNumber: string | null;
    whatsappMessageTemplate: string | null;
  };
}

export default function WhatsAppSetting({
  saveSettingApi,
  setting: { whatsappEnabled, whatsappNumber, whatsappMessageTemplate }
}: WhatsAppSettingProps) {
  const [enabled, setEnabled] = useState(whatsappEnabled || false);

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form method="POST" id="whatsappSetting" action={saveSettingApi}>
            <Card>
              <CardHeader>
                <CardTitle>Paramètres WhatsApp</CardTitle>
                <CardDescription>
                  Configurez la commande via WhatsApp pour vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {/* Enable/disable toggle */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="whatsappEnabled"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        value={enabled ? '1' : '0'}
                        className="sr-only peer"
                      />
                      <input
                        type="hidden"
                        name="whatsappEnabled"
                        value={enabled ? '1' : '0'}
                      />
                      <div
                        onClick={() => setEnabled(!enabled)}
                        className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
                          enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                    <span className="text-sm font-medium">
                      Activer la commande via WhatsApp
                    </span>
                  </div>

                  {enabled && (
                    <>
                      <InputField
                        name="whatsappNumber"
                        label="Numéro WhatsApp (avec indicatif pays)"
                        placeholder="21612345678"
                        defaultValue={whatsappNumber || ''}
                        required
                      />
                      <p className="text-xs text-muted-foreground -mt-3">
                        Exemple : 21612345678 (sans + ni espaces)
                      </p>
                      <TextareaField
                        name="whatsappMessageTemplate"
                        label="Modèle de message (optionnel)"
                        placeholder="Bonjour, je souhaite commander : {product} - Prix : {price} - Quantité : {qty}"
                        defaultValue={
                          whatsappMessageTemplate ||
                          'Bonjour, je souhaite commander :\n\nProduit : {product}\nPrix : {price}\nQuantité : {qty}\nLien : {url}'
                        }
                      />
                      <p className="text-xs text-muted-foreground -mt-3">
                        Variables disponibles : {'{product}'}, {'{price}'},{' '}
                        {'{qty}'}, {'{url}'}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Form>
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
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      whatsappEnabled
      whatsappNumber
      whatsappMessageTemplate
    }
  }
`;
