import { Network } from "@aptos-labs/ts-sdk";

export type CliArgs = {
  ledgerVersion?: bigint;
  network: Network;
  apiKey: string;
  poolListPath?: string;
  txVersionsPath?: string;
};

export type PoolListFile = {
  pools?: Array<{
    pool_addr?: string;
    hook_type?: number;
    assets?: string[];
  }>;
};

export type PoolSpec = {
  poolAddress: string;
  hookType: number;
  assets: string[];
};

export type PoolReservesRecord = {
  pool_address: string;
  hook_type: number;
  assets: string[];
  reserves_and_virtual_reserves: string[][];
};

export type PoolReservesOutput = {
  ledger_version: bigint;
  network: Network;
  pool_list_file: string;
  pool_count: number;
  view_functions: string[];
  pools: PoolReservesRecord[];
};

export type AliasPoolReservesOutput = {
  ledger_version: bigint;
  network: Network;
  pool_address: string;
  hook_type: number;
  view_function: string;
  assets: string[];
  reserves: string[];
  raw_result: unknown;
};
