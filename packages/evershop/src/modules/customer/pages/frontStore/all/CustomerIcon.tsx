import React from 'react';

interface UserIconProps {
  customer: {
    uuid: string;
    fullName: string;
    email: string;
  };
  accountUrl: string;
  loginUrl: string;
}

export default function UserIcon({
  customer,
  accountUrl,
  loginUrl
}: UserIconProps) {
  return (
    <a
      href={customer ? accountUrl : loginUrl}
      className="header-action-item"
    >
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </a>
  );
}

export const layout = {
  areaId: 'headerActions',
  sortOrder: 10
};

export const query = `
  query Query {
    customer: currentCustomer {
      uuid
      fullName
      email
    }
    accountUrl: url(routeId: "account")
    loginUrl: url(routeId: "login")
  }
`;
