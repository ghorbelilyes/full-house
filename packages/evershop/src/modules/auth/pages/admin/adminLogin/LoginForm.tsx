import React from 'react';
import './LoginForm.scss';
import Area from '@components/common/Area.js';
import { EmailField } from '@components/common/form/EmailField.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { PasswordField } from '@components/common/form/PasswordField.js';
import { Button } from '@components/common/ui/Button.js';
import { LockKeyhole, Mail } from 'lucide-react';

interface LoginFormProps {
  authUrl: string;
  brandConfig: {
    name?: string;
    logos?: {
      admin?: {
        src?: string;
        alt?: string;
        width?: number;
        height?: number;
      };
    };
  };
  dashboardUrl: string;
}

const SubmitButton: React.FC = () => {
  const {
    formState: { isSubmitting }
  } = useFormContext();
  return (
    <div className="form-submit-button flex border-t border-border mt-4 pt-4 justify-between">
      <Button type="submit" size="lg" isLoading={isSubmitting}>
        SE CONNECTER
      </Button>
    </div>
  );
};

export default function LoginForm({
  authUrl,
  brandConfig,
  dashboardUrl
}: LoginFormProps) {
  const [error, setError] = React.useState(null);
  const adminLogo = brandConfig?.logos?.admin;
  const adminAlt = adminLogo?.alt || brandConfig?.name || 'Store';

  const onSuccess = (response) => {
    if (!response.error) {
      window.location.href = dashboardUrl;
    } else {
      setError(response.error.message);
    }
  };

  return (
    <div className="admin-login-form">
      <style>{`
        .header {
          display: none !important;
        }
      `}</style>
      <div className="flex items-center justify-center mb-7">
        {adminLogo?.src ? (
          <img
            src={adminLogo.src}
            alt={adminAlt}
            width={adminLogo.width || 60}
            height={adminLogo.height || 60}
          />
        ) : (
          <span className="text-xl font-semibold">{adminAlt}</span>
        )}
      </div>
      {error && <div className="text-destructive py-2">{error}</div>}
      <Form
        action={authUrl}
        method="POST"
        id="adminLoginForm"
        onSuccess={onSuccess}
        submitBtn={false}
      >
        <Area
          id="adminLoginForm"
          className="space-y-3"
          coreComponents={[
            {
              component: {
                default: (
                  <EmailField
                    prefixIcon={<Mail className="h-5 w-5" />}
                    label="Email"
                    name="email"
                    placeholder="Email"
                    required
                    validation={{
                      required: 'L\'email est requis'
                    }}
                  />
                )
              },
              sortOrder: 10
            },
            {
              component: {
                default: (
                  <PasswordField
                    prefixIcon={<LockKeyhole className="h-5 w-5" />}
                    label="Mot de passe"
                    name="password"
                    placeholder="Mot de passe"
                    required
                    validation={{
                      required: 'Le mot de passe est requis'
                    }}
                    showToggle
                  />
                )
              },
              sortOrder: 20
            },
            {
              component: {
                default: <SubmitButton />
              },
              sortOrder: 30
            }
          ]}
        />
      </Form>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    authUrl: url(routeId: "adminLoginJson")
    dashboardUrl: url(routeId: "dashboard")
    brandConfig {
      name
      logos {
        admin {
          src
          alt
          width
          height
        }
      }
    }
  }
`;
