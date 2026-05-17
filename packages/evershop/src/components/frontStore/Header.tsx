import Area from '@components/common/Area.js';
import React from 'react';
import './Header.scss';

export function Header() {
  return (
    <header className="header-wrapper">
      {/* Top announcement strip — scrolls away */}
      <Area id="headerTopStrip" />

      {/* Sticky part: main header + nav bar */}
      <div className="header-sticky">
        <div className="main-header">
          <div className="main-header__brand">
            <Area id="headerBrand" />
          </div>
          <div className="main-header__search">
            <Area id="headerSearch" />
          </div>
          <div className="main-header__actions">
            <Area id="headerActions" />
          </div>
        </div>

        <nav className="nav-bar" aria-label="Navigation principale">
          <div className="nav-bar__links">
            <Area id="headerMiddleLeft" />
          </div>
        </nav>
      </div>
    </header>
  );
}
