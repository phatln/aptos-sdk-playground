import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
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

type BinarySearchState = {
  lower: number | string;
  upper: number | string;
};

const BINARY_SEARCH_STATE_PATH = path.join(__dirname, "last_binary_search.json");
const TARGET_SYMBOLS = ["USDT", "USDC"] as const;
const AGGREGATE_OUTPUT_DIR = path.join(__dirname, "aggre-reserves");
const execFileAsync = promisify(execFile);

function parseArgs() {
  const [, , txVersionArg] = process.argv;
  if (txVersionArg && !/^\d+$/.test(txVersionArg)) {
    throw new Error("Usage: npx ts-node src/pool-reserves/main.ts [tx_version]");
  }

  return { txVersion: txVersionArg };
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function printBanner(label: "FINISH" | "DONE") {
  const line = "=".repeat(label.length + 8);
  console.log(line);
  console.log(`=== ${label} ===`);
  console.log(line);
}

function parseBound(value: number | string, fieldName: string): bigint {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`Invalid ${fieldName} in ${BINARY_SEARCH_STATE_PATH}`);
    }
    return BigInt(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new Error(`Invalid ${fieldName} in ${BINARY_SEARCH_STATE_PATH}`);
}

async function readBinarySearchState(): Promise<{ lower: bigint; upper: bigint }> {
  const raw = await readFile(BINARY_SEARCH_STATE_PATH, "utf8");
  const parsed = JSON.parse(raw) as BinarySearchState;
  const lower = parseBound(parsed.lower, "lower");
  const upper = parseBound(parsed.upper, "upper");

  if (lower > upper) {
    throw new Error(`Invalid bounds in ${BINARY_SEARCH_STATE_PATH}: lower > upper`);
  }

  return { lower, upper };
}

async function writeBinarySearchState(lower: bigint, upper: bigint): Promise<void> {
  await writeFile(
    BINARY_SEARCH_STATE_PATH,
    JSON.stringify(
      {
        lower: lower.toString(),
        upper: upper.toString(),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
}

async function ensureSourceFiles(txVersion: string): Promise<void> {
  console.log(`Fetching pool reserves for tx=${txVersion}`);
  const poolResult = await execFileAsync("npx", ["ts-node", "src/pool-reserves/pool-balances.ts", txVersion], {
    cwd: process.cwd(),
  });
  if (poolResult.stdout.trim()) {
    console.log(poolResult.stdout.trim());
  }
  if (poolResult.stderr.trim()) {
    console.error(poolResult.stderr.trim());
  }

  console.log(`Fetching vault reserves for tx=${txVersion}`);
  const vaultResult = await execFileAsync("npx", ["ts-node", "src/pool-reserves/account-balances.ts", txVersion], {
    cwd: process.cwd(),
  });
  if (vaultResult.stdout.trim()) {
    console.log(vaultResult.stdout.trim());
  }
  if (vaultResult.stderr.trim()) {
    console.error(vaultResult.stderr.trim());
  }
}

async function main() {
  const { txVersion: txVersionArg } = parseArgs();
  const baseDir = __dirname;
  const state = await readBinarySearchState();
  const txVersion = txVersionArg ?? ((state.lower + state.upper) / 2n).toString();
  console.log(
    `Binary search start: lower=${state.lower.toString()} upper=${state.upper.toString()} tx=${txVersion}`
  );
  await ensureSourceFiles(txVersion);
  const vaultPath = path.join(baseDir, "vault-reserves", `vault-${txVersion}.json`);
  const poolPath = path.join(baseDir, "pool-reserves", `pool-${txVersion}.json`);
  await mkdir(AGGREGATE_OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(AGGREGATE_OUTPUT_DIR, `vault-pool-${txVersion}.csv`);

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

  const targetAssets = TARGET_SYMBOLS.map((symbol) => {
    const assetAddress = orderedAssets.find((asset) => symbolByAsset.get(asset) === symbol);
    return { symbol, assetAddress };
  });
  const vaultTotals = new Map<string, bigint>();
  const poolTotals = new Map<string, bigint>();

  for (const target of targetAssets) {
    if (!target.assetAddress) continue;
    vaultTotals.set(target.symbol, BigInt(vaultBalanceByAsset.get(target.assetAddress) ?? "0"));
    poolTotals.set(target.symbol, 0n);
  }

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

      const symbol = symbolByAsset.get(asset);
      if (symbol && poolTotals.has(symbol)) {
        const reserveValue = reserves[i];
        if (typeof reserveValue === "string" && /^\d+$/.test(reserveValue)) {
          poolTotals.set(symbol, (poolTotals.get(symbol) ?? 0n) + BigInt(reserveValue));
        }
      }
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
  const median = BigInt(txVersion);
  const anyPoolGreaterThanVault = TARGET_SYMBOLS.some((symbol) => {
    const poolTotal = poolTotals.get(symbol);
    const vaultTotal = vaultTotals.get(symbol);
    return poolTotal !== undefined && vaultTotal !== undefined && poolTotal > vaultTotal;
  });
  const nextLower = anyPoolGreaterThanVault ? state.lower : median;
  const nextUpper = anyPoolGreaterThanVault ? median : state.upper;
  await writeBinarySearchState(nextLower, nextUpper);
  console.log(`Wrote ${outputPath}`);
  console.log(
    `Updated ${BINARY_SEARCH_STATE_PATH} -> lower=${nextLower.toString()} upper=${nextUpper.toString()}`
  );
  printBanner(nextLower === nextUpper ? "DONE" : "FINISH");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
