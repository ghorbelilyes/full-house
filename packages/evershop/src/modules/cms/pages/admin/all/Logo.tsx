import React from 'react';

interface LogoProps {
  dashboardUrl: string;
}
export default function Logo({ dashboardUrl }: LogoProps) {
  return (
    <div className="logo flex items-center">
      <a href={dashboardUrl} className="flex items-center gap-2">
        <img
          src="/logo-icon.png"
          alt="Protek"
          width={36}
          height={36}
          className="w-9 h-9"
        />
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
  }
`;
