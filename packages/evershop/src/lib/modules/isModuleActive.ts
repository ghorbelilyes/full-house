/**
 * Lightweight synchronous module-status check.
 * Reads config/modules.json (cached after first read).
 * Works in any server-side context (core modules, extensions, middleware).
 *
 * For the full-featured service with DB overrides, use
 * the moduleManager extension's moduleRegistry service.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface ModuleEntry {
  code: string;
  contractIncluded: boolean;
  enabled: boolean;
  [key: string]: unknown;
}

interface ModulesConfig {
  contract?: { clientName?: string; plan?: string; expiresAt?: string | null };
  modules: Record<string, ModuleEntry>;
}

let cached: ModulesConfig | null = null;

function loadConfig(): ModulesConfig {
  if (cached) return cached;

  // 1. Try env var override (highest priority for contract)
  const envFeatures = process.env.CLIENT_FEATURES;
  if (envFeatures) {
    try {
      const parsed = JSON.parse(envFeatures) as Record<string, boolean>;
      const modules: Record<string, ModuleEntry> = {};
      for (const [code, enabled] of Object.entries(parsed)) {
        modules[code] = {
          code,
          contractIncluded: enabled,
          enabled
        };
      }
      cached = { modules };
      return cached;
    } catch {
      // fall through to file
    }
  }

  // 2. Read config/modules.json
  const configPath = resolve(process.cwd(), 'config/modules.json');
  if (existsSync(configPath)) {
    try {
      cached = JSON.parse(readFileSync(configPath, 'utf-8')) as ModulesConfig;
      return cached;
    } catch {
      // fall through to defaults
    }
  }

  // 3. Default: everything enabled
  cached = { modules: {} };
  return cached;
}

/**
 * Check if a module is available in the client's contract.
 * Returns true if the module is not listed (unknown modules default to available).
 */
export function isModuleAvailableInContract(code: string): boolean {
  const config = loadConfig();
  const mod = config.modules[code];
  if (!mod) return true;
  return mod.contractIncluded !== false;
}

/**
 * Check if a module is active (contract-included AND enabled).
 * Returns true if the module is not listed (unknown modules default to active).
 * This is a config-file-only check (no DB). For DB-aware check, use moduleRegistry.
 */
export function isModuleActive(code: string): boolean {
  const config = loadConfig();
  const mod = config.modules[code];
  if (!mod) return true;
  if (mod.contractIncluded === false) return false;
  return mod.enabled !== false;
}

/**
 * Get the full modules config object.
 */
export function getModulesConfig(): ModulesConfig {
  return loadConfig();
}

/**
 * Clear the cached config. Call after updating config/modules.json at runtime.
 */
export function clearModulesConfigCache(): void {
  cached = null;
}
