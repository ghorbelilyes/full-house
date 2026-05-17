import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface TaxClassFormProps {
  saveTaxClassApi: string;
  closeModal: () => void;
  getTaxClasses: (options?: { requestPolicy?: string }) => Promise<void> | void;
}

function TaxClassForm({
  saveTaxClassApi,
  closeModal,
  getTaxClasses
}: TaxClassFormProps) {
  return (
    <Form
      id="createTaxClass"
      method="POST"
      action={saveTaxClassApi}
      submitBtn={false}
      onSuccess={async () => {
        await getTaxClasses({ requestPolicy: 'network-only' });
        closeModal();
      }}
    >
      <InputField
        name="name"
        type="text"
        label="Nom de la classe de taxe"
        defaultValue=""
        placeholder="Entrer le nom de la classe de taxe"
        required
        validation={{ required: 'Le nom de la classe de taxe est requis' }}
      />
      <div className="flex justify-end gap-2 mt-3">
        <Button title="Annuler" variant="secondary" onClick={closeModal}>
          Annuler
        </Button>
        <Button
          title="Enregistrer"
          variant="default"
          onClick={() => {
            (
              document.getElementById('createTaxClass') as HTMLFormElement
            ).dispatchEvent(
              new Event('submit', {
                cancelable: true,
                bubbles: true
              })
            );
          }}
        >
          Enregistrer
        </Button>
      </div>
    </Form>
  );
}

export { TaxClassForm };
