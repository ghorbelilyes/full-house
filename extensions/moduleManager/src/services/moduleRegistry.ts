/**
 * Module registry service — full-featured version with DB override support.
 * Reads config/modules.json for contract defaults, then overlays DB overrides.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/* ── Types ── */
export interface ModuleDefinition {
  code: string;
  name: string;
  description: string;
  version: string;
  type: 'core' | 'extension';
  extensionName?: string;
  subFeature?: string;
  contractIncluded: boolean;
  enabled: boolean;
  settingsRoute: string | null;
  icon: string;
}

export interface ContractInfo {
  clientName: string;
  plan: string;
  expiresAt: string | null;
}

export interface ModulesConfig {
  version: string;
  contract: ContractInfo;
  modules: Record<string, ModuleDefinition>;
}

interface DbOverride {
  code: string;
  enabled: boolean;
}

/* ── Cache ── */
let fileConfig: ModulesConfig | null = null;
let dbOverrides: Map<string, boolean> | null = null;
let dbLoaded = false;
let dbLoadedAt = 0;
const DB_CACHE_TTL_MS = 5000; // Re-read DB overrides every 5 seconds

const DEFAULT_CONTRACT: ContractInfo = {
  clientName: 'Default',
  plan: 'full',
  expiresAt: null
};

/* ── File config ── */
function loadFileConfig(): ModulesConfig {
  if (fileConfig) return fileConfig;

  const configPath = resolve(process.cwd(), 'config/modules.json');
  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf-8'));

      // Apply CLIENT_FEATURES env override on top
      const envFeatures = process.env.CLIENT_FEATURES;
      if (envFeatures) {
        try {
          const parsed = JSON.parse(envFeatures) as Record<string, boolean>;
          for (const [code, included] of Object.entries(parsed)) {
            if (raw.modules[code]) {
              raw.modules[code].contractIncluded = included;
              if (!included) raw.modules[code].enabled = false;
            }
          }
        } catch { /* ignore malformed env */ }
      }

      fileConfig = raw as ModulesConfig;
      return fileConfig;
    } catch {
      // fall through
    }
  }

  fileConfig = {
    version: '1.0.0',
    contract: DEFAULT_CONTRACT,
    modules: {}
  };
  return fileConfig;
}

/* ── DB overrides ── */
async function loadDbOverrides(pool: any): Promise<Map<string, boolean>> {
  const now = Date.now();
  if (dbOverrides && dbLoaded && (now - dbLoadedAt) < DB_CACHE_TTL_MS) {
    return dbOverrides;
  }

  dbOverrides = new Map();
  try {
    const result = await pool.query(
      'SELECT code, enabled FROM module_config'
    );
    for (const row of result.rows) {
      dbOverrides.set(row.code, row.enabled);
    }
    dbLoaded = true;
    dbLoadedAt = now;
  } catch {
    // Table might not exist yet (pre-migration). That's OK.
    dbLoaded = true;
    dbLoadedAt = now;
  }
  return dbOverrides;
}

/* ── Public API ── */

export function getContract(): ContractInfo {
  return loadFileConfig().contract || DEFAULT_CONTRACT;
}

export function getAllModuleDefinitions(): Record<string, ModuleDefinition> {
  return loadFileConfig().modules;
}

export function getModuleDefinition(code: string): ModuleDefinition | null {
  return loadFileConfig().modules[code] || null;
}

export function isModuleAvailableInContract(code: string): boolean {
  const mod = getModuleDefinition(code);
  if (!mod) return true;
  return mod.contractIncluded !== false;
}

/**
 * Synchronous check using file config + cached DB overrides.
 * If DB overrides have been loaded (by a prior async call), they are used.
 * Otherwise falls back to file config only.
 * Use for bootstrap and middleware where async isn't available.
 */
export function isModuleEnabledSync(code: string): boolean {
  const mod = getModuleDefinition(code);
  if (!mod) return true;
  if (mod.contractIncluded === false) return false;

  // Use cached DB overrides if available
  if (dbOverrides && dbOverrides.has(code)) {
    return dbOverrides.get(code)!;
  }

  return mod.enabled !== false;
}

/**
 * Full check with DB override support.
 * Resolution: contractIncluded=false → always disabled
 *             DB override → takes precedence
 *             File config enabled → fallback
 */
export async function isModuleEnabled(
  code: string,
  pool: any
): Promise<boolean> {
  const mod = getModuleDefinition(code);
  if (!mod) return true;
  if (mod.contractIncluded === false) return false;

  const overrides = await loadDbOverrides(pool);
  if (overrides.has(code)) {
    return overrides.get(code)!;
  }

  return mod.enabled !== false;
}

/**
 * Get all module statuses (with DB overrides applied).
 */
export async function getAllModuleStatuses(
  pool: any
): Promise<Record<string, boolean>> {
  const config = loadFileConfig();
  const overrides = await loadDbOverrides(pool);
  const statuses: Record<string, boolean> = {};

  for (const [code, mod] of Object.entries(config.modules)) {
    if (mod.contractIncluded === false) {
      statuses[code] = false;
    } else if (overrides.has(code)) {
      statuses[code] = overrides.get(code)!;
    } else {
      statuses[code] = mod.enabled !== false;
    }
  }

  return statuses;
}

/**
 * Full module info for admin page.
 */
export async function getAllModulesForAdmin(pool: any) {
  const config = loadFileConfig();
  const overrides = await loadDbOverrides(pool);
  const modules = [];

  for (const [code, mod] of Object.entries(config.modules)) {
    const isContractIncluded = mod.contractIncluded !== false;
    let isEnabled: boolean;
    if (!isContractIncluded) {
      isEnabled = false;
    } else if (overrides.has(code)) {
      isEnabled = overrides.get(code)!;
    } else {
      isEnabled = mod.enabled !== false;
    }

    modules.push({
      ...mod,
      code,
      enabled: isEnabled,
      locked: !isContractIncluded
    });
  }

  return {
    contract: config.contract || DEFAULT_CONTRACT,
    modules
  };
}

/**
 * Toggle a module's enabled status (saved to DB).
 * Returns false if module is not in contract (can't be enabled).
 */
export async function setModuleEnabled(
  code: string,
  enabled: boolean,
  pool: any
): Promise<boolean> {
  const mod = getModuleDefinition(code);
  if (!mod) return false;
  if (mod.contractIncluded === false && enabled) return false;

  await pool.query(
    `INSERT INTO module_config (code, enabled, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (code)
     DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
    [code, enabled]
  );

  // Invalidate cache
  dbOverrides = null;
  dbLoaded = false;
  dbLoadedAt = 0;

  return true;
}

/**
 * Throw-friendly version for API handlers.
 */
export function requireModuleEnabled(code: string): void {
  if (!isModuleEnabledSync(code)) {
    const error: any = new Error('Ce module est désactivé pour ce magasin.');
    error.statusCode = 403;
    error.code = 'MODULE_DISABLED';
    throw error;
  }
}

/**
 * Clear all caches. Call after config file changes.
 */
export function clearCache(): void {
  fileConfig = null;
  dbOverrides = null;
  dbLoaded = false;
  dbLoadedAt = 0;
}
