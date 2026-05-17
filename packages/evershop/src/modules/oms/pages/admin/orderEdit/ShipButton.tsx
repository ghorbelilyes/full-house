import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { useAlertContext } from '@components/common/modal/Alert.js';
import RenderIfTrue from '@components/common/RenderIfTrue.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';
import { toast } from 'react-toastify';

interface ShipButtonProps {
  order: {
    noShippingRequired: boolean;
    shipment?: {
      trackingNumber?: string;
      carrier?: string;
    };
    createShipmentApi: string;
    shipmentStatus: {
      code: string;
    };
  };
  carriers: {
    label: string;
    value: string;
  }[];
}
export default function ShipButton({
  order: { noShippingRequired, shipment, createShipmentApi, shipmentStatus },
  carriers
}: ShipButtonProps) {
  const { openAlert, closeAlert, dispatchAlert } = useAlertContext();
  if (noShippingRequired) {
    return (
      <Button disabled variant="secondary">
        Livraison non requise
      </Button>
    );
  }
  if (shipment) {
    return null;
  } else {
    return (
      <RenderIfTrue condition={shipmentStatus.code !== 'canceled'}>
        <Button
          variant="default"
          onClick={() => {
            openAlert({
              heading: 'Expédier les articles',
              content: (
                <div>
                  <Form
                    id="ship-items"
                    method="POST"
                    action={createShipmentApi}
                    submitBtn={false}
                    onSuccess={(response) => {
                      if (response.error) {
                        toast.error(response.error.message);
                        dispatchAlert({
                          type: 'update',
                          payload: { secondaryAction: { isLoading: false } }
                        });
                      } else {
                        // Reload the page
                        window.location.reload();
                      }
                    }}
                    onInvalid={() => {
                      dispatchAlert({
                        type: 'update',
                        payload: { secondaryAction: { isLoading: false } }
                      });
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <InputField
                          type="text"
                          name="tracking_number"
                          label="Numéro de suivi"
                          placeholder="Numéro de suivi"
                        />
                      </div>
                      <div>
                        <SelectField
                          name="carrier"
                          label="Transporteur"
                          options={carriers}
                        />
                      </div>
                    </div>
                  </Form>
                </div>
              ),
              primaryAction: {
                title: 'Annuler',
                onAction: closeAlert,
                variant: 'outline'
              },
              secondaryAction: {
                title: 'Expédier',
                onAction: () => {
                  dispatchAlert({
                    type: 'update',
                    payload: { secondaryAction: { isLoading: true } }
                  });
                  (
                    document.getElementById('ship-items') as HTMLFormElement
                  ).dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                },
                variant: 'default',
                isLoading: false
              }
            });
          }}
        >
          Expédier les articles
        </Button>
      </RenderIfTrue>
    );
  }
}

export const layout = {
  areaId: 'order_actions',
  sortOrder: 10
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId")) {
      noShippingRequired
      shipment {
        shipmentId
        carrier
        trackingNumber
        updateShipmentApi
      }
      shipmentStatus {
        code
      }
      createShipmentApi
    },
    carriers {
      label: name
      value: code
    }
  }
`;
