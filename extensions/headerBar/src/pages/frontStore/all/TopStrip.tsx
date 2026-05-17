import React, { useEffect, useState } from 'react';

interface HeaderBarMessage {
  icon?: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
}

interface TopStripProps {
  setting: {
    headerBarEnabled: boolean;
    headerBarMessages: HeaderBarMessage[];
  };
}

function isSvg(str: string) {
  if (!str) return false;
  const t = str.trim();
  return t.startsWith('<svg') || t.startsWith('<?xml');
}

function StripIcon({ icon }: { icon: string }) {
  if (isSvg(icon)) {
    let svg = icon;
    if (!svg.includes('width=')) {
      svg = svg.replace('<svg', '<svg width="18" height="18"');
    }
    return (
      <span
        className="top-strip__icon-wrap"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return <span className="top-strip__emoji">{icon}</span>;
}

function MessageContent({ msg }: { msg: HeaderBarMessage }) {
  return (
    <span className="top-strip__msg">
      {msg.icon && <StripIcon icon={msg.icon} />}
      <span dangerouslySetInnerHTML={{ __html: msg.text }} />
      {msg.linkText && (
        <>
          {' '}
          <a href={msg.linkUrl || '#'}>{msg.linkText}</a>
        </>
      )}
    </span>
  );
}

export default function TopStrip({ setting }: TopStripProps) {
  if (!setting?.headerBarEnabled) return null;

  const messages = setting.headerBarMessages || [];
  if (messages.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="top-strip">
      {/* Desktop: show all messages side by side */}
      <div className="top-strip__inner top-strip__inner--desktop">
        {messages.map((msg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="top-strip__divider" />}
            <MessageContent msg={msg} />
          </React.Fragment>
        ))}
      </div>
      {/* Mobile: auto-rotating single message */}
      <div className="top-strip__inner top-strip__inner--mobile">
        <div className="top-strip__slider">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`top-strip__slide${
                i === activeIndex ? ' top-strip__slide--active' : ''
              }`}
            >
              <MessageContent msg={msg} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'headerTopStrip',
  sortOrder: 10
};

export const query = `
  query Query {
    setting {
      headerBarEnabled
      headerBarMessages {
        icon
        text
        linkText
        linkUrl
      }
    }
  }
`;
