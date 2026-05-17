import { SettingMenu } from '@components/admin/SettingMenu.js';
import Spinner from '@components/admin/Spinner.js';
import { Form } from '@components/common/form/Form.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { useQuery } from 'urql';
import { TaxClasses } from './components/TaxClasses.js';
import { TaxClassForm } from './components/TaxClassForm.js';

const CountriesQuery = `
  query Country($countries: [String]) {
    countries (countries: $countries) {
      value: code
      label: name
      provinces {
        value: code
        label: name
      }
    }
  }
`;

const TaxClassesQuery = `
  query TaxClasses {
    taxClasses {
      items {
        taxClassId
        uuid
        name
        rates {
          taxRateId
          uuid
          name
          rate
          isCompound
          country
          province
          postcode
          priority
          updateApi
          deleteApi
        }
        addRateApi
      }
    }
  }
`;

interface TaxSettingProps {
  createTaxClassApi: string;
  saveSettingApi: string;
  setting: {
    defaultProductTaxClassId?: number;
    defaultShippingTaxClassId?: number;
    baseCalculationAddress?: string;
  };
}
export default function TaxSetting({
  createTaxClassApi,
  saveSettingApi,
  setting
}: TaxSettingProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [countriesQueryData] = useQuery({
    query: CountriesQuery
  });

  const [taxClassesQueryData, reexecuteQuery] = useQuery({
    query: TaxClassesQuery
  });

  if (countriesQueryData.fetching || taxClassesQueryData.fetching) {
    return (
      <div className="main-content-inner">
        <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
          <div className="col-span-2">
            <SettingMenu />
          </div>
          <div className="col-span-4">
            <Card>
              <CardContent>
                <Spinner width={30} height={30} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4 grid grid-cols-1 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du calcul des taxes</CardTitle>
              <CardDescription>
                Configurer les classes de taxes disponibles pour vos
                clients lors du paiement.
              </CardDescription>
            </CardHeader>
            <CardContent title="Configuration de base">
              <Form
                id="taxBasicConfig"
                method="POST"
                action={saveSettingApi}
                successMessage="Les paramètres de taxe ont été enregistrés avec succès !"
              >
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <SelectField
                      name="defaultShippingTaxClassId"
                      label="Classe de taxe d'expédition"
                      defaultValue={setting.defaultShippingTaxClassId}
                      placeholder="Aucune"
                      options={[
                        {
                          value: -1,
                          label: 'Allocation proportionnelle basée sur les articles du panier'
                        },
                        {
                          value: 0,
                          label: 'Taux de taxe le plus élevé basé sur les articles du panier'
                        }
                      ].concat(
                        taxClassesQueryData.data.taxClasses.items.map(
                          (taxClass) => ({
                            value: taxClass.taxClassId,
                            label: taxClass.name
                          })
                        ) || []
                      )}
                      helperText="C'est la classe de taxe appliquée aux frais d'expédition."
                    />
                  </div>
                  <div>
                    <SelectField
                      name="baseCalculationAddress"
                      label="Adresse de calcul de base"
                      defaultValue={setting.baseCalculationAddress || ''}
                      options={[
                        {
                          value: 'shippingAddress',
                          label: 'Adresse de livraison'
                        },
                        {
                          value: 'billingAddress',
                          label: 'Adresse de facturation'
                        },
                        {
                          value: 'storeAddress',
                          label: 'Adresse du magasin'
                        }
                      ]}
                      helperText="C'est l'adresse utilisée pour calculer les taux de taxe."
                    />
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
          <Card title="Tax classes">
            <CardHeader>
              <CardTitle>Classes de taxes</CardTitle>
              <CardDescription>
                Gérer les classes de taxes et les taux pour différentes régions.
              </CardDescription>
            </CardHeader>
            <TaxClasses
              classes={taxClassesQueryData.data.taxClasses.items}
              getTaxClasses={reexecuteQuery}
            />
            <CardContent>
              <div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger>
                    <Button
                      title="Créer une nouvelle classe de taxe"
                      variant="outline"
                      onClick={() => setDialogOpen(true)}
                    >
                      Créer une nouvelle classe de taxe
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle classe de taxe</DialogTitle>
                    </DialogHeader>
                    <TaxClassForm
                      saveTaxClassApi={createTaxClassApi}
                      closeModal={() => setDialogOpen(false)}
                      getTaxClasses={reexecuteQuery}
                    />
                  </DialogContent>
                </Dialog>
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
    createTaxClassApi: url(routeId: "createTaxClass")
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      defaultProductTaxClassId
      defaultShippingTaxClassId
      baseCalculationAddress
    }
  }
`;
