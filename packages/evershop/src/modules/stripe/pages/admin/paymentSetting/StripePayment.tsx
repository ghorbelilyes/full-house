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

interface StripePaymentProps {
  setting: {
    stripePaymentStatus: true | false | 0 | 1;
    stripeDisplayName: string;
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeEndpointSecret: string;
    stripePaymentMode: string;
  };
}
export default function StripePayment({
  setting: {
    stripePaymentStatus,
    stripeDisplayName,
    stripePublishableKey,
    stripeSecretKey,
    stripeEndpointSecret,
    stripePaymentMode
  }
}: StripePaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement Stripe</CardTitle>
        <CardDescription>
          Configurer les paramètres de la passerelle de paiement Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Activer ?</h4>
          </div>
          <div className="col-span-2">
            <ToggleField
              name="stripePaymentStatus"
              defaultValue={stripePaymentStatus}
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
              name="stripeDisplayName"
              placeholder="Nom affiché"
              defaultValue={stripeDisplayName || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clé publique</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripePublishableKey"
              placeholder="Clé publique"
              defaultValue={stripePublishableKey || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clé secrète</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripeSecretKey"
              placeholder="Clé secrète"
              defaultValue={stripeSecretKey || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clé secrète du Webhook</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripeEndpointSecret"
              placeholder="Clé secrète"
              defaultValue={stripeEndpointSecret || ''}
              helperText="L'URL de votre webhook doit être : https://votredomaine.com/api/stripe/webhook"
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
              name="stripePaymentMode"
              defaultValue={stripePaymentMode}
              options={[
                { label: 'Autorisation uniquement', value: 'authorizeOnly' },
                { label: 'Capture', value: 'capture' }
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
  sortOrder: 10
};

export const query = `
  query Query {
    setting {
      stripeDisplayName
      stripePaymentStatus
      stripePublishableKey
      stripeSecretKey
      stripeEndpointSecret
      stripePaymentMode
    }
  }
`;
