import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
  createObjectAddress,
  createResourceAddress,
} from "@aptos-labs/ts-sdk";
import {
  getPackageAddresses,
  HOOK_TYPE_AMM,
  HOOK_TYPE_CLMM,
  HOOK_TYPE_STABLE,
  PackageAddresses,
  PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION,
  VIEWS_PACKAGE_ADDRESS,
} from "./constants";
import { PoolReservesOutput, PoolReservesRecord, PoolSpec } from "./types";

function textBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  return bytes;
}

function getReservesFunction(pool: PoolSpec, packages: PackageAddresses): string {
  if (pool.hookType === HOOK_TYPE_AMM) {
    return `${VIEWS_PACKAGE_ADDRESS}::amm_views`;
  }

  if (pool.hookType === HOOK_TYPE_CLMM) {
    return `${VIEWS_PACKAGE_ADDRESS}::clmm_views`;
  }

  if (pool.hookType === HOOK_TYPE_STABLE) {
    return `${VIEWS_PACKAGE_ADDRESS}::stable_views`;
  }

  throw new Error(`Unsupported hook type ${pool.hookType} for pool ${pool.poolAddress}`);
}

function asFunctionId(value: string): `${string}::${string}::${string}` {
  return value as `${string}::${string}::${string}`;
}

function deriveVirtualAssetAddress(poolAddress: string, assetAddress: string, packages: PackageAddresses): string {
  const tappPackageAddress = AccountAddress.fromString(packages.tappPackageAddress);
  const vaultAddress = createResourceAddress(tappPackageAddress, "VAULT");
  const seed = concatBytes(
    textBytes("tapp::"),
    AccountAddress.fromString(poolAddress).bcsToBytes(),
    textBytes("::"),
    AccountAddress.fromString(assetAddress).bcsToBytes()
  );

  return createObjectAddress(vaultAddress, seed).toStringLong();
}

export function createAptosClient(network: Network, apiKey: string): Aptos {
  return new Aptos(
    new AptosConfig({
      network,
      clientConfig: {
        API_KEY: apiKey,
      },
    })
  );
}

async function fetchAmmOrClmmReserves(
  aptos: Aptos,
  pool: PoolSpec,
  ledgerVersion: bigint,
  packages: PackageAddresses
): Promise<string[]> {
  const modulePrefix = getReservesFunction(pool, packages);
  const [reserveA] = await aptos.view<[string]>({
    payload: {
      function: asFunctionId(`${modulePrefix}::reserve_a`),
      typeArguments: [],
      functionArguments: [pool.poolAddress],
    },
    options: { ledgerVersion },
  });
  const [reserveB] = await aptos.view<[string]>({
    payload: {
      function: asFunctionId(`${modulePrefix}::reserve_b`),
      typeArguments: [],
      functionArguments: [pool.poolAddress],
    },
    options: { ledgerVersion },
  });

  return [String(reserveA), String(reserveB)];
}

async function fetchStableReserves(
  aptos: Aptos,
  pool: PoolSpec,
  ledgerVersion: bigint,
  packages: PackageAddresses
): Promise<string[]> {
  const [balances] = await aptos.view<[string[]]>({
    payload: {
      function: asFunctionId(`${VIEWS_PACKAGE_ADDRESS}::stable_views::stored_balances`),
      typeArguments: [],
      functionArguments: [pool.poolAddress],
    },
    options: { ledgerVersion },
  });

  return (balances ?? []).map((value) => String(value));
}

async function fetchPoolReservesOnly(
  aptos: Aptos,
  pool: PoolSpec,
  ledgerVersion: bigint,
  packages: PackageAddresses
): Promise<string[]> {
  if (pool.hookType === HOOK_TYPE_STABLE) {
    return fetchStableReserves(aptos, pool, ledgerVersion, packages);
  }

  if (pool.hookType === HOOK_TYPE_AMM || pool.hookType === HOOK_TYPE_CLMM) {
    return fetchAmmOrClmmReserves(aptos, pool, ledgerVersion, packages);
  }

  throw new Error(`Unsupported hook type ${pool.hookType} for pool ${pool.poolAddress}`);
}

async function fetchVirtualReserves(
  aptos: Aptos,
  pool: PoolSpec,
  ledgerVersion: bigint,
  packages: PackageAddresses
): Promise<string[]> {
  const balances: string[] = [];

  for (const assetAddress of pool.assets) {
    const virtualAssetAddress = deriveVirtualAssetAddress(pool.poolAddress, assetAddress, packages);
    const [balance] = await aptos.view<[string]>({
      payload: {
        function: PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION,
        typeArguments: ["0x1::object::ObjectCore"],
        functionArguments: [pool.poolAddress, virtualAssetAddress],
      },
      options: { ledgerVersion },
    });
    balances.push(String(balance));
  }

  return balances;
}

export async function fetchPoolReserves(
  aptos: Aptos,
  pool: PoolSpec,
  ledgerVersion: bigint,
  packages: PackageAddresses
): Promise<PoolReservesRecord> {
  const reserves = await fetchPoolReservesOnly(aptos, pool, ledgerVersion, packages);
  const virtualReserves = await fetchVirtualReserves(aptos, pool, ledgerVersion, packages);

  return {
    pool_address: pool.poolAddress,
    hook_type: pool.hookType,
    assets: pool.assets,
    reserves_and_virtual_reserves: [reserves, virtualReserves],
  };
}

export async function fetchLedgerSnapshot(
  aptos: Aptos,
  ledgerVersion: bigint,
  pools: PoolSpec[],
  network: Network,
  poolListPath: string
): Promise<PoolReservesOutput> {
  const packages = getPackageAddresses(network);
  const results: PoolReservesRecord[] = [];

  for (const pool of pools) {
    try {
      results.push(await fetchPoolReserves(aptos, pool, ledgerVersion, packages));
    } catch (error) {
      results.push({
        pool_address: pool.poolAddress,
        hook_type: pool.hookType,
        assets: pool.assets,
        reserves_and_virtual_reserves: [],
      });

      console.warn(
        `Failed pool=${pool.poolAddress} ledger=${ledgerVersion.toString()}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return {
    ledger_version: ledgerVersion,
    network,
    pool_list_file: poolListPath,
    pool_count: pools.length,
    view_functions: [
      `${VIEWS_PACKAGE_ADDRESS}::amm_views::reserve_a`,
      `${VIEWS_PACKAGE_ADDRESS}::amm_views::reserve_b`,
      `${VIEWS_PACKAGE_ADDRESS}::clmm_views::reserve_a`,
      `${VIEWS_PACKAGE_ADDRESS}::clmm_views::reserve_b`,
      `${VIEWS_PACKAGE_ADDRESS}::stable_views::stored_balances`,
      PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION,
    ],
    pools: results,
  };
}
