import { useIsMobile } from '@components/common/ui/hooks/useIsMobile.js';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '@components/common/ui/NavigationMenu.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import {
  BadgePercent,
  ChevronRightIcon,
  Home,
  Menu as MenuIcon,
  Store,
  ShoppingCart,
  XIcon
} from 'lucide-react';
import React from 'react';

interface MenuNode {
  id: string;
  name: string;
  url: string;
  type: string;
  uuid: string;
  children: MenuNode[];
}

interface BasicMenuProps {
  basicMenuWidget: {
    menus: MenuNode[];
    isMain: boolean;
    className: string;
  };
  homeUrl: string;
  catalogUrl: string;
  cartUrl: string;
}

function getPathname(url: string) {
  try {
    return new URL(url, 'http://localhost').pathname || '/';
  } catch {
    return url.split('?')[0] || '/';
  }
}

function addQueryParam(url: string, key: string, value: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}

/* ── Recursive sub-item inside dropdown panels ───────────── */
function SubMenuItem({
  item,
  depth,
  currentPath
}: {
  item: MenuNode;
  depth: number;
  currentPath: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  /* Exact match only for sub-items — avoids "/camera" highlighting on "/camera/…" */
  const active = currentPath === item.url;

  if (hasChildren) {
    return (
      <li className="nav-submenu__group">
        <a
          href={item.url && item.url !== '#' ? item.url : undefined}
          className={cn(
            'nav-submenu__heading',
            active && 'nav-submenu__heading--active'
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {item.name}
        </a>
        <ul className="nav-submenu__list">
          {item.children.map((child) => (
            <SubMenuItem
              key={child.uuid || child.name}
              item={child}
              depth={depth + 1}
              currentPath={currentPath}
            />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <a
        href={item.url}
        className={cn(
          'nav-submenu__link',
          active && 'nav-submenu__link--active'
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        {item.name}
      </a>
    </li>
  );
}

/* ── Mobile recursive accordion ──────────────────────────── */
function MobileMenuItem({
  item,
  depth,
  currentPath,
  closeMenu
}: {
  item: MenuNode;
  depth: number;
  currentPath: string;
  closeMenu: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const active = currentPath === item.url;

  return (
    <div className="w-full">
      <div
        className="flex items-center w-full"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <a
          href={item.url}
          onClick={(e) => {
            if (hasChildren && (item.url === '#' || !item.url)) {
              e.preventDefault();
              setOpen(!open);
            } else {
              closeMenu();
            }
          }}
          className={cn(
            'flex-1 px-4 py-2.5 text-base transition-colors hover:text-primary',
            active && 'text-primary font-semibold',
            depth > 0 && 'text-sm'
          )}
        >
          {item.name}
        </a>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 hover:text-primary"
            aria-label={`${open ? 'Replier' : 'Déplier'} ${item.name}`}
            aria-expanded={open}
          >
            <ChevronRightIcon
              aria-hidden
              className="w-4 h-4 transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="border-l border-border ml-4">
          {item.children.map((child) => (
            <MobileMenuItem
              key={child.uuid || child.name}
              item={child}
              depth={depth + 1}
              currentPath={currentPath}
              closeMenu={closeMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BasicMenu({
  basicMenuWidget: { menus, isMain, className },
  homeUrl,
  catalogUrl,
  cartUrl
}: BasicMenuProps) {
  const [isOpen, setIsOpen] = React.useState(!isMain);
  const isMobile = useIsMobile();
  const [currentPath, setCurrentPath] = React.useState('');
  const [currentSearch, setCurrentSearch] = React.useState('');
  const homeHref = homeUrl || '/';
  const catalogHref = '/boutique';
  const promoHref = '/search?promo=1';
  const cartHref = cartUrl || '/cart';

  React.useEffect(() => {
    setCurrentPath(window.location.pathname);
    setCurrentSearch(window.location.search);
  }, []);

  /* Exact match for individual links – also considers query params */
  const isExactActive = (url: string) => {
    if (!url || url === '#') return false;
    const pathname = getPathname(url);
    if (currentPath !== pathname) return false;
    // If the url has query params, verify they all match
    try {
      const parsed = new URL(url, 'http://localhost');
      const urlParams = parsed.searchParams;
      // If the menu item url has no query params, it matches only when
      // the current page also has no distinguishing params (e.g. promo)
      if ([...urlParams.keys()].length === 0) {
        // Check that no distinguishing param is present on the current page
        const distinguishing = ['promo'];
        const curParams = new URLSearchParams(currentSearch);
        return !distinguishing.some((k) => curParams.has(k));
      }
      // Each param in the menu url must match the current page
      const curParams = new URLSearchParams(currentSearch);
      for (const [key, val] of urlParams.entries()) {
        if (curParams.get(key) !== val) return false;
      }
      return true;
    } catch {
      return currentPath === pathname;
    }
  };

  /* Check if any descendant (recursively) is exactly active */
  const hasActiveDescendant = (item: MenuNode): boolean => {
    if (isExactActive(item.url)) return true;
    return (item.children || []).some((c) => hasActiveDescendant(c));
  };

  const isHomeActive = isExactActive(homeHref);
  const isCatalogActive =
    currentPath === '/boutique';
  const isPromoActive =
    isExactActive(promoHref) &&
    new URLSearchParams(currentSearch).get('promo') === '1';
  const isCartActive = isExactActive(cartHref);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn('nav-menu', className)}>
      {isMain && isMobile ? (
        <>
          <nav
            className="mobile-bottom-nav"
            aria-label="Navigation principale en bas"
          >
            <a
              href={homeHref}
              className={cn(
                'mobile-bottom-nav__item',
                isHomeActive && 'mobile-bottom-nav__item--active'
              )}
              aria-current={isHomeActive ? 'page' : undefined}
            >
              <Home aria-hidden className="mobile-bottom-nav__icon" />
              <span>Accueil</span>
            </a>
            <a
              href={catalogHref}
              className={cn(
                'mobile-bottom-nav__item',
                isCatalogActive && 'mobile-bottom-nav__item--active'
              )}
              aria-current={isCatalogActive ? 'page' : undefined}
            >
              <Store aria-hidden className="mobile-bottom-nav__icon" />
              <span>Boutique</span>
            </a>
            <a
              href={promoHref}
              className={cn(
                'mobile-bottom-nav__item',
                isPromoActive && 'mobile-bottom-nav__item--active'
              )}
              aria-current={isPromoActive ? 'page' : undefined}
            >
              <BadgePercent aria-hidden className="mobile-bottom-nav__icon" />
              <span>Promo</span>
            </a>
            <a
              href={cartHref}
              className={cn(
                'mobile-bottom-nav__item',
                isCartActive && 'mobile-bottom-nav__item--active'
              )}
              aria-current={isCartActive ? 'page' : undefined}
            >
              <ShoppingCart aria-hidden className="mobile-bottom-nav__icon" />
              <span>Panier</span>
            </a>
            <button
              type="button"
              onClick={toggleMenu}
              className={cn(
                'mobile-bottom-nav__item',
                isOpen && 'mobile-bottom-nav__item--active'
              )}
              aria-label={
                isOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal'
              }
              aria-expanded={isOpen}
              aria-controls="mobile-main-menu"
            >
              {isOpen ? (
                <XIcon aria-hidden className="mobile-bottom-nav__icon" />
              ) : (
                <MenuIcon aria-hidden className="mobile-bottom-nav__icon" />
              )}
              <span>Menu</span>
            </button>
          </nav>
          <div
            id="mobile-main-menu"
            className={cn(
              'mobile-bottom-nav__drawer',
              isOpen ? 'block' : 'hidden'
            )}
          >
            <div className="mobile-bottom-nav__drawer-header">
              <span>Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="mobile-bottom-nav__drawer-close"
                aria-label="Fermer le menu principal"
              >
                <XIcon aria-hidden />
              </button>
            </div>
            <div className="mobile-bottom-nav__drawer-content">
              <div className="flex flex-col w-full">
                {menus.map((item) => (
                  <MobileMenuItem
                    key={item.uuid || item.name}
                    item={item}
                    depth={0}
                    currentPath={currentPath}
                    closeMenu={closeMenu}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-start gap-4 items-center">
          <nav className="nav-menu__nav p-2 relative md:flex md:justify-center w-full">
            <div className="nav-menu__bar flex justify-between items-center w-full">
              <div
                className={cn(
                  isMain
                    ? 'md:flex absolute md:relative -left-10 md:left-0 top-full md:top-auto mt-2 md:mt-0 w-screen md:w-auto p-2 md:p-0 min-w-62.5 bg-white md:bg-transparent z-30'
                    : 'flex relative -left-10 md:left-0 w-screen md:w-auto p-2 md:p-0 min-w-62.5 bg-white md:bg-transparent',
                  isOpen ? 'block' : 'hidden',
                  'md:flex'
                )}
              >
                {/* ── Mobile: accordion tree ─────────────────── */}
                {isMobile ? (
                  <div className="flex flex-col w-full">
                    {menus.map((item) => (
                      <MobileMenuItem
                        key={item.uuid || item.name}
                        item={item}
                        depth={0}
                        currentPath={currentPath}
                        closeMenu={closeMenu}
                      />
                    ))}
                  </div>
                ) : (
                  /* ── Desktop: horizontal nav with dropdowns ── */
                  <NavigationMenu className="w-full max-w-full">
                    <NavigationMenuList className="flex-row items-center w-auto">
                      {menus.map((item) => {
                        const hasKids =
                          item.children && item.children.length > 0;
                        const active = hasActiveDescendant(item);

                        return (
                          <NavigationMenuItem
                            key={item.uuid}
                            className="w-auto"
                          >
                            {hasKids ? (
                              <>
                                <NavigationMenuTrigger
                                  className={cn(
                                    'w-auto justify-center bg-transparent hover:bg-transparent focus:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-popup-open:bg-transparent data-popup-open:hover:bg-transparent hover:font-semibold hover:text-primary',
                                    active && 'text-primary font-semibold'
                                  )}
                                >
                                  {item.name}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                  <ul className="nav-submenu__panel">
                                    {item.children.map((subItem) => (
                                      <SubMenuItem
                                        key={subItem.uuid || subItem.name}
                                        item={subItem}
                                        depth={0}
                                        currentPath={currentPath}
                                      />
                                    ))}
                                  </ul>
                                </NavigationMenuContent>
                              </>
                            ) : (
                              <NavigationMenuLink
                                href={item.url}
                                className={cn(
                                  'w-auto px-4 py-2 hover:text-primary transition-colors hover:bg-transparent focus:bg-transparent hover:underline text-base',
                                  isExactActive(item.url)
                                    ? 'text-primary font-semibold'
                                    : ''
                                )}
                                data-active={isExactActive(item.url)}
                              >
                                {item.name}
                              </NavigationMenuLink>
                            )}
                          </NavigationMenuItem>
                        );
                      })}
                    </NavigationMenuList>
                  </NavigationMenu>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

// 3 levels deep for GraphQL (schema is recursive but queries must be explicit)
export const query = `
  query Query($settings: JSON) {
    basicMenuWidget(settings: $settings) {
      menus {
        id
        name
        url
        type
        uuid
        children {
          id
          name
          url
          type
          uuid
          children {
            id
            name
            url
            type
            uuid
            children {
              id
              name
              url
              type
              uuid
            }
          }
        }
      }
      isMain
      className
    }
    homeUrl: url(routeId: "homepage")
    catalogUrl: url(routeId: "catalogSearch")
    cartUrl: url(routeId: "cart")
  }
`;

export const variables = `{
  settings: getWidgetSetting()
}`;
