// @ts-nocheck
import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { Form } from '@components/common/form/Form.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import RenderIfTrue from '@components/common/RenderIfTrue.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface ReturnActionsProps {
  requestReturnApi: string;
  receiveReturnApi: string;
  order: {
    paymentMethod: string;
    paymentStatus: {
      code: string;
    };
    shipmentStatus: {
      code: string;
    };
    status: {
      code: string;
    };
  };
}

function submitForm(id: string) {
  (document.getElementById(id) as HTMLFormElement).dispatchEvent(
    new Event('submit', { cancelable: true, bubbles: true })
  );
}

export default function ReturnActions({
  requestReturnApi,
  receiveReturnApi,
  order
}: ReturnActionsProps) {
  const requestForm = useForm();
  const receiveForm = useForm();
  const canRequestReturn =
    order.status.code !== 'canceled' && order.shipmentStatus.code === 'delivered';
  const canReceiveReturn = order.shipmentStatus.code === 'return_requested';
  const canMarkManualRefund =
    ['paid', 'refund_pending'].includes(order.paymentStatus.code) &&
    !['stripe', 'paypal'].includes(order.paymentMethod);

  return (
    <div className="flex gap-2">
      <RenderIfTrue condition={canRequestReturn}>
        <Dialog>
          <DialogTrigger>
            <Button variant="secondary">Demander un retour</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demander un retour</DialogTitle>
            </DialogHeader>
            <Form
              form={requestForm}
              id="requestReturn"
              method="POST"
              action={requestReturnApi}
              submitBtn={false}
              onSuccess={(response) => {
                if (response.error) {
                  toast.error(response.error.message);
                } else {
                  window.location.reload();
                }
              }}
            >
              <TextareaField
                name="reason"
                label="Motif du retour"
                placeholder="Motif du retour"
                required
                validation={{
                  required: 'Le motif est requis'
                }}
              />
            </Form>
            <DialogFooter>
              <DialogClose>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button
                variant="default"
                isLoading={requestForm.formState.isSubmitting}
                onClick={() => submitForm('requestReturn')}
              >
                Confirmer le retour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RenderIfTrue>
      <RenderIfTrue condition={canReceiveReturn}>
        <Dialog>
          <DialogTrigger>
            <Button variant="default">Retour reçu</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retour reçu</DialogTitle>
            </DialogHeader>
            <Form
              form={receiveForm}
              id="receiveReturn"
              method="POST"
              action={receiveReturnApi}
              submitBtn={false}
              onSuccess={(response) => {
                if (response.error) {
                  toast.error(response.error.message);
                } else {
                  window.location.reload();
                }
              }}
            >
              <TextareaField
                name="reason"
                label="Note interne"
                placeholder="Note interne"
              />
              <RenderIfTrue condition={canMarkManualRefund}>
                <CheckboxField
                  name="mark_refunded"
                  label="Marquer le paiement comme remboursé"
                  defaultValue={false}
                />
              </RenderIfTrue>
            </Form>
            <DialogFooter>
              <DialogClose>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button
                variant="default"
                isLoading={receiveForm.formState.isSubmitting}
                onClick={() => submitForm('receiveReturn')}
              >
                Confirmer la réception
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RenderIfTrue>
    </div>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 36
};

export const query = `
  query Query {
    requestReturnApi: url(routeId: "requestOrderReturn", params: [{key: "id", value: getContextValue("orderId")}])
    receiveReturnApi: url(routeId: "receiveOrderReturn", params: [{key: "id", value: getContextValue("orderId")}])
    order(uuid: getContextValue("orderId")) {
      paymentMethod
      paymentStatus {
        code
      }
      shipmentStatus {
        code
      }
      status {
        code
      }
    }
  }
`;
