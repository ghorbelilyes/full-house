import { PoolClient } from '@evershop/postgres-query-builder';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
declare const connectionSetting: PoolConfig;
declare const pool: Pool;
declare function getConnection(): Promise<PoolClient>;
export { pool, getConnection, connectionSetting };
