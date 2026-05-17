import { InputField } from '@components/common/form/InputField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface CODPaymentProps {
  setting: {
    codPaymentStatus: true | false | 0 | 1;
    codDisplayName: string;
  };
}
export default function CODPayment({
  setting: { codPaymentStatus, codDisplayName }
}: CODPaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement à la livraison</CardTitle>
        <CardDescription>
          Configurer les paramètres de paiement à la livraison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Activer ?</h4>
          </div>
          <div className="col-span-2 flex justify-start">
            <ToggleField
              name="codPaymentStatus"
              defaultValue={codPaymentStatus}
              trueValue={1}
              falseValue={0}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Nom affiché</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="codDisplayName"
              placeholder="Nom affiché"
              defaultValue={codDisplayName}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 20
};

export const query = `
  query Query {
    setting {
      codPaymentStatus
      codDisplayName
    }
  }
`;
