import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface PaypalPaymentProps {
  setting: {
    paypalPaymentStatus: true | false | 0 | 1;
    paypalDisplayName: string;
    paypalClientId: string;
    paypalClientSecret: string;
    paypalEnvironment: string;
    paypalPaymentIntent: string;
  };
}
export default function PaypalPayment({
  setting: {
    paypalPaymentStatus,
    paypalDisplayName,
    paypalClientId,
    paypalClientSecret,
    paypalEnvironment,
    paypalPaymentIntent
  }
}: PaypalPaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement PayPal</CardTitle>
        <CardDescription>
          Configurer les paramètres de la passerelle de paiement PayPal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Activer ?</h4>
          </div>
          <div className="col-span-2">
            <ToggleField
              name="paypalPaymentStatus"
              defaultValue={paypalPaymentStatus}
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
              name="paypalDisplayName"
              placeholder="Nom affiché"
              defaultValue={paypalDisplayName}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Identifiant client</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="paypalClientId"
              placeholder="Identifiant client"
              defaultValue={paypalClientId}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clé secrète client</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="paypalClientSecret"
              placeholder="Clé secrète"
              defaultValue={paypalClientSecret}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Environnement</h4>
          </div>
          <div className="col-span-2">
            <RadioGroupField
              name="paypalEnvironment"
              defaultValue={paypalEnvironment}
              options={[
                {
                  label: 'Sandbox',
                  value: 'https://api-m.sandbox.paypal.com'
                },
                {
                  label: 'Live',
                  value: 'https://api-m.paypal.com'
                }
              ]}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Mode de paiement</h4>
          </div>
          <div className="col-span-2">
            <RadioGroupField
              name="paypalPaymentIntent"
              defaultValue={paypalPaymentIntent}
              options={[
                { label: 'Autorisation uniquement', value: 'AUTHORIZE' },
                { label: 'Capture', value: 'CAPTURE' }
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 15
};

export const query = `
  query Query {
    setting {
      paypalPaymentStatus
      paypalDisplayName
      paypalClientId
      paypalClientSecret
      paypalEnvironment
      paypalPaymentIntent
    }
  }
`;
