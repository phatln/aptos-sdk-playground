import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_ENV_PATH,
  DEFAULT_POOL_LIST_PATH,
  DEFAULT_TX_VERSIONS_PATH,
  PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION,
} from "./constants";
import { parseNetwork } from "./cli";
import { fileExists, readLedgerVersions, resolveExistingPath } from "./files";

dotenv.config({ path: DEFAULT_ENV_PATH });

const DEFAULT_ACCOUNT_ADDRESS =
  "0x57edaae7ac6e3813b057a675c05f155c0296f6757050e213dda7d8941b79609d";
const OUTPUT_DIR = path.join(__dirname, "vault-reserves");

type PoolListJson = {
  pools?: Array<{
    pool_addr?: string;
    assets?: string[];
    tokens?: Array<{
      addr?: string;
      symbol?: string;
    }>;
  }>;
};

type AssetEntry = {
  asset_address: string;
  symbol: string;
  pools: string[];
  balance: string;
};

function asFunctionId(value: string): `${string}::${string}::${string}` {
  return value as `${string}::${string}::${string}`;
}

function outputPath(ledgerVersion: bigint): string {
  return path.join(OUTPUT_DIR, `vault-${ledgerVersion.toString()}.json`);
}

function parseArgs() {
  const [, , cliLedgerVersion, cliNetwork, cliPoolListPath, cliTxVersionsPath] = process.argv;
  const accountAddress = DEFAULT_ACCOUNT_ADDRESS;
  const ledgerVersionInput = cliLedgerVersion ?? process.env.LEDGER_VERSION;
  const network = parseNetwork(cliNetwork ?? process.env.APTOS_NETWORK ?? process.env.NETWORK);
  const apiKey = process.env.APTOS_API_KEY ?? process.env.API_KEY;

  if (ledgerVersionInput && !/^\d+$/.test(ledgerVersionInput)) {
    throw new Error(`Invalid ledger version: ${ledgerVersionInput}`);
  }

  if (!apiKey) {
    throw new Error("Missing API key. Set APTOS_API_KEY or API_KEY in the environment.");
  }

  return {
    accountAddress,
    ledgerVersion: ledgerVersionInput ? BigInt(ledgerVersionInput) : undefined,
    network,
    apiKey,
    poolListPath: cliPoolListPath,
    txVersionsPath: cliTxVersionsPath,
  };
}

async function readUniqueAssets(poolListPath: string): Promise<Array<{ assetAddress: string; symbol: string; pools: string[] }>> {
  const raw = await import("node:fs/promises").then((fs) => fs.readFile(poolListPath, "utf8"));
  const parsed = JSON.parse(raw) as PoolListJson;
  const deduped = new Map<string, { assetAddress: string; symbol: string; pools: Set<string> }>();

  for (const pool of parsed.pools ?? []) {
    const poolAddress = typeof pool.pool_addr === "string" ? pool.pool_addr.trim() : "";
    const symbolByAsset = new Map<string, string>();

    for (const token of pool.tokens ?? []) {
      const assetAddress = typeof token.addr === "string" ? token.addr.trim() : "";
      const symbol = typeof token.symbol === "string" ? token.symbol.trim() : "";
      if (assetAddress) {
        symbolByAsset.set(assetAddress, symbol || "unknown");
      }
    }

    for (const asset of pool.assets ?? []) {
      const assetAddress = typeof asset === "string" ? asset.trim() : "";
      if (!assetAddress) continue;

      const existing = deduped.get(assetAddress);
      if (existing) {
        if (poolAddress) existing.pools.add(poolAddress);
        if (existing.symbol === "unknown" && symbolByAsset.has(assetAddress)) {
          existing.symbol = symbolByAsset.get(assetAddress) ?? existing.symbol;
        }
        continue;
      }

      deduped.set(assetAddress, {
        assetAddress,
        symbol: symbolByAsset.get(assetAddress) ?? "unknown",
        pools: new Set(poolAddress ? [poolAddress] : []),
      });
    }
  }

  if (deduped.size === 0) {
    throw new Error(`No assets found in ${poolListPath}`);
  }

  return Array.from(deduped.values()).map((entry) => ({
    assetAddress: entry.assetAddress,
    symbol: entry.symbol,
    pools: Array.from(entry.pools),
  }));
}

async function main() {
  const {
    accountAddress,
    ledgerVersion,
    network,
    apiKey,
    poolListPath: cliPoolListPath,
    txVersionsPath: cliTxVersionsPath,
  } = parseArgs();
  const poolListPath = await resolveExistingPath(cliPoolListPath, DEFAULT_POOL_LIST_PATH, "Pool list");
  const txVersionsPath = await resolveExistingPath(
    cliTxVersionsPath,
    DEFAULT_TX_VERSIONS_PATH,
    "Tx versions"
  );
  const aptos = new Aptos(
    new AptosConfig({
      network,
      clientConfig: {
        API_KEY: apiKey,
      },
    })
  );

  const assets = await readUniqueAssets(poolListPath);
  const ledgerVersions = ledgerVersion ? [ledgerVersion] : await readLedgerVersions(txVersionsPath);
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const currentLedgerVersion of ledgerVersions) {
    const filePath = outputPath(currentLedgerVersion);
    if (await fileExists(filePath)) {
      console.log(`Cache hit: ${filePath}`);
      continue;
    }

    const balances: AssetEntry[] = [];

    for (const asset of assets) {
      const [balance] = await aptos.view<[string]>({
        payload: {
          function: asFunctionId(PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION),
          typeArguments: ["0x1::object::ObjectCore"],
          functionArguments: [accountAddress, asset.assetAddress],
        },
        options: { ledgerVersion: currentLedgerVersion },
      });

      balances.push({
        asset_address: asset.assetAddress,
        symbol: asset.symbol,
        pools: asset.pools,
        balance: String(balance),
      });
    }

    const output = {
      account_address: accountAddress,
      ledger_version: currentLedgerVersion.toString(),
      network,
      pool_list_file: poolListPath,
      asset_count: balances.length,
      view_function: PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION,
      balances,
    };

    await writeFile(filePath, JSON.stringify(output, null, 2) + "\n", "utf8");
    console.log(`Wrote ${filePath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
