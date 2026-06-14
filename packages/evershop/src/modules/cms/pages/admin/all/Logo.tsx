import React from 'react';

interface LogoProps {
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
export default function Logo({ brandConfig, dashboardUrl }: LogoProps) {
  const adminLogo = brandConfig?.logos?.admin;
  const alt = adminLogo?.alt || brandConfig?.name || 'Store';

  return (
    <div className="logo flex items-center">
      <a href={dashboardUrl} className="flex items-center gap-2">
        {adminLogo?.src ? (
          <img
            src={adminLogo.src}
            alt={alt}
            width={adminLogo.width || 36}
            height={adminLogo.height || 36}
            className="w-9 h-9"
          />
        ) : (
          <span className="text-sm font-semibold">{alt}</span>
        )}
      </a>
    </div>
  );
}

export const layout = {
  areaId: 'header',
  sortOrder: 10
};

export const query = `
  query query {
    dashboardUrl: url(routeId:"dashboard")
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
