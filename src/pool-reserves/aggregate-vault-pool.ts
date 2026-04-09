import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_POOL_LIST_PATH } from "./constants";

type PoolsJson = {
  pools?: Array<{
    pool_addr?: string;
    assets?: string[];
    tokens?: Array<{
      addr?: string;
      symbol?: string;
    }>;
  }>;
};

type VaultJson = {
  balances?: Array<{
    asset_address?: string;
    balance?: string;
  }>;
};

type PoolReservesJson = {
  pools?: Array<{
    pool_address?: string;
    assets?: string[];
    reserves_and_virtual_reserves?: string[][];
  }>;
};

function parseArgs() {
  const [, , txVersionArg] = process.argv;
  if (!txVersionArg || !/^\d+$/.test(txVersionArg)) {
    throw new Error("Usage: npx ts-node src/pool-reserves/aggregate-vault-pool.ts <tx_version>");
  }

  return { txVersion: txVersionArg };
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

async function main() {
  const { txVersion } = parseArgs();
  const baseDir = __dirname;
  const vaultPath = path.join(baseDir, "vault-reserves", `vault-${txVersion}.json`);
  const poolPath = path.join(baseDir, "pool-reserves", `pool-${txVersion}.json`);
  const outputPath = path.join(baseDir, `vault-pool-${txVersion}.csv`);

  const [poolsRaw, vaultRaw, poolReservesRaw] = await Promise.all([
    readFile(DEFAULT_POOL_LIST_PATH, "utf8"),
    readFile(vaultPath, "utf8"),
    readFile(poolPath, "utf8"),
  ]);

  const poolsJson = JSON.parse(poolsRaw) as PoolsJson;
  const vaultJson = JSON.parse(vaultRaw) as VaultJson;
  const poolReservesJson = JSON.parse(poolReservesRaw) as PoolReservesJson;

  const symbolByAsset = new Map<string, string>();
  for (const pool of poolsJson.pools ?? []) {
    for (const token of pool.tokens ?? []) {
      const asset = token.addr?.trim();
      const symbol = token.symbol?.trim();
      if (asset && symbol && !symbolByAsset.has(asset)) {
        symbolByAsset.set(asset, symbol);
      }
    }
  }

  const orderedAssets = (vaultJson.balances ?? [])
    .map((entry) => entry.asset_address?.trim())
    .filter((asset): asset is string => Boolean(asset));

  if (orderedAssets.length === 0) {
    throw new Error(`No balances found in ${vaultPath}`);
  }

  const headers = [
    "pool_addr",
    ...orderedAssets.map((asset, index) => symbolByAsset.get(asset) ?? `asset_${index + 1}`),
  ];

  const vaultBalanceByAsset = new Map<string, string>();
  for (const balance of vaultJson.balances ?? []) {
    const asset = balance.asset_address?.trim();
    if (asset) {
      vaultBalanceByAsset.set(asset, balance.balance ?? "0");
    }
  }

  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));
  lines.push(
    [
      "0x0 (vault)",
      ...orderedAssets.map((asset) => vaultBalanceByAsset.get(asset) ?? "0"),
    ]
      .map(csvCell)
      .join(",")
  );

  for (const pool of poolReservesJson.pools ?? []) {
    const poolAddress = pool.pool_address?.trim();
    if (!poolAddress) continue;

    const reserves = Array.isArray(pool.reserves_and_virtual_reserves?.[0])
      ? pool.reserves_and_virtual_reserves![0]
      : [];
    const reserveByAsset = new Map<string, string>();

    for (let i = 0; i < (pool.assets ?? []).length; i += 1) {
      const asset = pool.assets?.[i]?.trim();
      if (!asset) continue;
      reserveByAsset.set(asset, reserves[i] ?? "N/A");
    }

    lines.push(
      [
        poolAddress,
        ...orderedAssets.map((asset) => reserveByAsset.get(asset) ?? "N/A"),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
