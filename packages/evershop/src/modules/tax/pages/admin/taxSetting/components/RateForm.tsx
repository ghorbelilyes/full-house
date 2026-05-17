import Spinner from '@components/admin/Spinner.js';
import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';
import { TaxRate } from './Rate.js';

const MethodsQuery = `
  query Methods {
    shippingMethods {
      value: shippingMethodId
      label: name
    }
    createShippingMethodApi: url(routeId: "createShippingMethod")
  }
`;

interface MethodFormProps {
  saveRateApi: string;
  closeModal: () => void;
  getTaxClasses: (options?: { requestPolicy?: string }) => Promise<void> | void;
  rate?: TaxRate;
}

function RateForm({
  saveRateApi,
  closeModal,
  getTaxClasses,
  rate
}: MethodFormProps) {
  const form = useForm({
    shouldUnregister: true
  });
  const [saving, setSaving] = React.useState(false);
  const [result] = useQuery({
    query: MethodsQuery
  });

  if (result.fetching) {
    return (
      <div className="flex justify-center p-2">
        <Spinner width={25} height={25} />
      </div>
    );
  }

  return (
    <Form
      form={form}
      id="taxRateForm"
      method={rate ? 'PATCH' : 'POST'}
      action={saveRateApi}
      submitBtn={false}
      onError={(error: string) => {
        toast.error(error);
        setSaving(false);
      }}
      onSuccess={async (response) => {
        if (!response.error) {
          await getTaxClasses({ requestPolicy: 'network-only' });
          closeModal();
          toast.success('Le taux de taxe a été enregistré avec succès !');
        } else {
        }
        setSaving(false);
      }}
    >
      <div className="py-3 border-t border-border">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <InputField
              name="name"
              placeholder="Nom"
              required
              validation={{ required: 'Le nom est requis' }}
              label="Nom"
              defaultValue={rate?.name}
            />
          </div>
          <div>
            <NumberField
              name="rate"
              label="Taux"
              placeholder="Taux"
              required
              validation={{ required: 'Le taux est requis' }}
              defaultValue={rate?.rate}
            />
          </div>
        </div>
      </div>
      <div className="py-3 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div>
            <InputField
              name="country"
              label="Pays"
              placeholder="Pays"
              required
              validation={{ required: 'Le pays est requis' }}
              defaultValue={rate?.country}
              helperText='Code pays (ex : « TN »). Utilisez « * » pour tous les pays.'
            />
          </div>
          <div>
            <InputField
              name="province"
              label="Province"
              placeholder="Province"
              required
              validation={{ required: 'La province est requise' }}
              defaultValue={rate?.province}
              helperText='Code province (ex : « CA »). Utilisez « * » pour toutes les provinces.'
            />
          </div>
          <div>
            <InputField
              name="postcode"
              label="Code postal"
              placeholder="Code postal"
              required
              validation={{ required: 'Le code postal est requis' }}
              defaultValue={rate?.postcode}
              helperText='Code postal (ex : « 1000 »). Vide pour tous les codes postaux.'
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <ToggleField
              name="is_compound"
              label="Composé"
              defaultValue={rate?.isCompound || false}
            />
          </div>
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <NumberField
              name="priority"
              label="Priorité"
              placeholder="Priorité"
              validation={{ required: 'La priorité est requise' }}
              required
              defaultValue={rate?.priority}
            />
          </div>
          <div />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button title="Annuler" variant="secondary" onClick={closeModal}>
          Annuler
        </Button>
        <Button
          title="Enregistrer"
          variant="default"
          onClick={async () => {
            const result = await form.trigger();
            if (!result) {
              return;
            }
            setSaving(true);
            (
              document.getElementById('taxRateForm') as HTMLFormElement
            ).dispatchEvent(
              new Event('submit', {
                cancelable: true,
                bubbles: true
              })
            );
          }}
          isLoading={saving}
        >
          Enregistrer
        </Button>
      </div>
    </Form>
  );
}

export { RateForm };
