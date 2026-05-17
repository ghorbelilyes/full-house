import { SettingMenu } from '@components/admin/SettingMenu.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface InventorySettingProps {
  saveSettingApi: string;
  setting: {
    allowNegativeStock: boolean;
  };
}

export default function InventorySetting({
  saveSettingApi,
  setting: { allowNegativeStock }
}: InventorySettingProps) {
  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form
            method="POST"
            id="inventorySetting"
            action={saveSettingApi}
            successMessage="Paramètres de stock enregistrés"
          >
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du stock</CardTitle>
                <CardDescription>
                  Configurez le comportement de gestion des stocks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Area
                  id="inventorySettingForm"
                  className="space-y-5"
                  coreComponents={[
                    {
                      component: {
                        default: (
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-border bg-muted/30">
                              <ToggleField
                                name="allowNegativeStock"
                                label="Autoriser les commandes sans limite de stock"
                                helperText="Lorsque cette option est activée, les clients peuvent commander n'importe quelle quantité d'un produit, même si le stock disponible est insuffisant. Le stock peut devenir négatif après la confirmation de la commande."
                                defaultValue={
                                  allowNegativeStock ? '1' : '0'
                                }
                                trueValue={'1' as any}
                                falseValue={'0' as any}
                                trueLabel="Activé"
                                falseLabel="Désactivé"
                              />
                              <p className="mt-3 text-sm text-muted-foreground">
                                Les produits ne seront jamais affichés comme
                                « épuisé » ou « rupture de stock » lorsque
                                cette option est activée.
                              </p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                              <span className="text-amber-600 dark:text-amber-400 text-lg leading-none mt-0.5">
                                ⚠️
                              </span>
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                <strong>Attention :</strong> avec cette option
                                activée, le stock peut devenir négatif. Veillez
                                à surveiller régulièrement vos niveaux de stock
                                pour éviter les problèmes de
                                réapprovisionnement.
                              </p>
                            </div>
                          </div>
                        )
                      },
                      sortOrder: 10
                    }
                  ]}
                />
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
      allowNegativeStock
    }
  }
`;
