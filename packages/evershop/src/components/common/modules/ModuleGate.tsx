/**
 * ModuleGate — conditional renderer based on module status.
 *
 * Usage (with window.__moduleStatuses injected by ModuleStatusScript):
 *   import { ModuleGate, useModuleEnabled } from '@components/common/modules/ModuleGate.js';
 *
 *   <ModuleGate module="wishlist">
 *     <WishlistButton productId={id} />
 *   </ModuleGate>
 *
 *   const enabled = useModuleEnabled('coupons');
 */
import React, { ReactNode, useState, useEffect } from 'react';

declare global {
  interface Window {
    __moduleStatuses?: Record<string, boolean>;
  }
}

/**
 * Read module status from window.__moduleStatuses.
 * Returns undefined when statuses are not available (SSR).
 */
function readModuleStatus(moduleCode: string): boolean | undefined {
  if (typeof window !== 'undefined' && window.__moduleStatuses) {
    return window.__moduleStatuses[moduleCode] !== false;
  }
  return undefined;
}

/**
 * Hook: returns true if the module is enabled.
 *
 * Uses useState + useEffect to avoid SSR/client hydration mismatch.
 * - SSR: always returns true (renders everything)
 * - Client initial render (hydration): also returns true (matches SSR)
 * - After hydration (useEffect): reads window.__moduleStatuses and
 *   re-renders with the correct value if the module is disabled.
 */
export function useModuleEnabled(moduleCode: string): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const status = readModuleStatus(moduleCode);
    if (status !== undefined && !status) {
      setEnabled(false);
    }
  }, [moduleCode]);

  return enabled;
}

/**
 * Component: renders children only if the module is enabled.
 */
export function ModuleGate({
  module,
  children,
  fallback = null
}: {
  module: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const enabled = useModuleEnabled(module);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

export default ModuleGate;
