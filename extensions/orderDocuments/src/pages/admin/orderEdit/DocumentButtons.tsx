import React from 'react';

interface DocumentButtonsProps {
  order: {
    uuid: string;
    orderNumber: string;
  };
}

export default function DocumentButtons({ order }: DocumentButtonsProps) {
  const baseUrl = `/api/orders/${order.uuid}/document`;

  const documents = [
    {
      type: 'facture',
      label: 'Facture',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      color: '#e48125'
    },
    {
      type: 'bon_commande',
      label: 'Bon de commande',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="15" y2="16"/>
        </svg>
      ),
      color: '#2563eb'
    },
    {
      type: 'bon_livraison',
      label: 'Bon de livraison',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      color: '#059669'
    }
  ];

  const handleClick = (type: string) => {
    const url = `${baseUrl}/${type}`;
    window.open(url, '_blank');
  };

  const handlePreview = (type: string) => {
    const url = `${baseUrl}/${type}?format=html`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        fontSize: '14px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        Documents
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {documents.map((doc) => (
          <div key={doc.type} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={() => handleClick(doc.type)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#fff',
                border: `1px solid ${doc.color}40`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: doc.color,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = `${doc.color}10`;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '#fff';
              }}
            >
              {doc.icon}
              {doc.label}
              <span style={{
                marginLeft: 'auto',
                fontSize: '10px',
                fontWeight: 500,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreview(doc.type)}
              title="Aperçu HTML"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fafafa',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 5
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId", null)) {
      uuid
      orderNumber
    }
  }
`;
