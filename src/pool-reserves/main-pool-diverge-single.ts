import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { DEFAULT_POOL_LIST_PATH } from "./constants";

type BinarySearchState = {
  lower: number | string;
  upper: number | string;
};

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

type PoolReservesJson = {
  pools?: Array<{
    pool_address?: string;
    assets?: string[];
    reserves_and_virtual_reserves?: string[][];
  }>;
};

type ComparisonRow = {
  asset_address: string;
  symbol: string;
  decimals: number;
  reserve: string;
  virtual_reserve: string;
  reserve_minus_virtual: string;
  threshold: string;
  diverged: boolean;
};

const STATE_PATH = path.join(__dirname, "last_pool_diverge_search_single.json");
const OUTPUT_DIR = path.join(__dirname, "pool-diverge-reserves");
const execFileAsync = promisify(execFile);

const SYMBOL_DECIMALS: Record<string, number> = {
  APT: 8,
  amAPT: 8,
  USD1: 6,
  USDT: 6,
  USDC: 6,
  goAPT: 8,
  kAPT: 8,
  RION: 6,
  TAPP: 8,
  WBTC: 8,
  xBTC: 8,
  aBTC: 10,
  AMA: 8,
  BUBBLE: 8,
  APTDOG: 6,
  WHIMSY: 6,
  JET: 6,
  stkAPT: 8,
  PEPTOS: 6,
  SANAPTOS: 6,
  LCAT: 6,
  PEACE: 6,
  Crime: 8,
  stAPT: 8,
};

function printBanner(label: "FINISH" | "DONE") {
  const line = "=".repeat(label.length + 8);
  console.log(line);
  console.log(`=== ${label} ===`);
  console.log(line);
}

function parseArgs() {
  const [, , poolAddressArg, txVersionArg] = process.argv;

  if (!poolAddressArg) {
    throw new Error(
      "Usage: npx ts-node src/pool-reserves/main-pool-diverge-single.ts <pool_address> [tx_version]"
    );
  }

  if (!/^0x[0-9a-fA-F]+$/.test(poolAddressArg)) {
    throw new Error(`Invalid pool address: ${poolAddressArg}`);
  }

  if (txVersionArg && !/^\d+$/.test(txVersionArg)) {
    throw new Error(`Invalid tx version: ${txVersionArg}`);
  }

  return {
    poolAddress: normalizeAddress(poolAddressArg),
    txVersion: txVersionArg,
  };
}

function normalizeAddress(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  return `0x${hex.padStart(64, "0")}`;
}

function parseBound(value: number | string, fieldName: string): bigint {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`Invalid ${fieldName} in ${STATE_PATH}`);
    }
    return BigInt(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new Error(`Invalid ${fieldName} in ${STATE_PATH}`);
}

async function readState(): Promise<{ lower: bigint; upper: bigint }> {
  const raw = await readFile(STATE_PATH, "utf8");
  const parsed = JSON.parse(raw) as BinarySearchState;
  const lower = parseBound(parsed.lower, "lower");
  const upper = parseBound(parsed.upper, "upper");

  if (lower > upper) {
    throw new Error(`Invalid bounds in ${STATE_PATH}: lower > upper`);
  }

  return { lower, upper };
}

async function writeState(lower: bigint, upper: bigint): Promise<void> {
  await writeFile(
    STATE_PATH,
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

async function ensurePoolSnapshot(txVersion: string): Promise<void> {
  const result = await execFileAsync("npx", ["ts-node", "src/pool-reserves/pool-balances.ts", txVersion], {
    cwd: process.cwd(),
  });

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
}

function thresholdForDecimals(decimals: number): bigint {
  if (decimals <= 0) return 0n;
  return 10n ** BigInt(decimals - 1);
}

async function main() {
  const { poolAddress, txVersion: txVersionArg } = parseArgs();
  async function evaluateAtTx(txVersion: string): Promise<boolean> {
    console.log(`Fetching pool reserves for tx=${txVersion}`);
    await ensurePoolSnapshot(txVersion);

    const [poolsRaw, poolReservesRaw] = await Promise.all([
      readFile(DEFAULT_POOL_LIST_PATH, "utf8"),
      readFile(path.join(__dirname, "pool-reserves", `pool-${txVersion}.json`), "utf8"),
    ]);

    const poolsJson = JSON.parse(poolsRaw) as PoolsJson;
    const poolReservesJson = JSON.parse(poolReservesRaw) as PoolReservesJson;

    const symbolByAsset = new Map<string, string>();
    for (const pool of poolsJson.pools ?? []) {
      for (const token of pool.tokens ?? []) {
        const asset = token.addr ? normalizeAddress(token.addr) : undefined;
        const symbol = token.symbol?.trim();
        if (asset && symbol && !symbolByAsset.has(asset)) {
          symbolByAsset.set(asset, symbol);
        }
      }
    }

    const record = (poolReservesJson.pools ?? []).find(
      (pool) => pool.pool_address && normalizeAddress(pool.pool_address) === poolAddress
    );
    if (!record) {
      throw new Error(`Pool ${poolAddress} not found in pool snapshot for tx=${txVersion}`);
    }

    const reserves = Array.isArray(record.reserves_and_virtual_reserves?.[0])
      ? record.reserves_and_virtual_reserves![0]
      : [];
    const virtualReserves = Array.isArray(record.reserves_and_virtual_reserves?.[1])
      ? record.reserves_and_virtual_reserves![1]
      : [];
    const assets = (record.assets ?? []).map((asset) => normalizeAddress(asset));

    const rows: ComparisonRow[] = [];
    let diverged = false;

    for (let i = 0; i < assets.length; i += 1) {
      const assetAddress = assets[i];
      const reserveRaw = reserves[i] ?? "0";
      const virtualRaw = virtualReserves[i] ?? "0";
      if (!/^\d+$/.test(reserveRaw) || !/^\d+$/.test(virtualRaw)) {
        continue;
      }

      const symbol = symbolByAsset.get(assetAddress) ?? "unknown";
      const decimals = SYMBOL_DECIMALS[symbol] ?? 8;
      const threshold = thresholdForDecimals(decimals);
      const reserve = BigInt(reserveRaw);
      const virtualReserve = BigInt(virtualRaw);
      const reserveMinusVirtual = reserve - virtualReserve;
      const assetDiverged = reserveMinusVirtual >= threshold;

      rows.push({
        asset_address: assetAddress,
        symbol,
        decimals,
        reserve: reserve.toString(),
        virtual_reserve: virtualReserve.toString(),
        reserve_minus_virtual: reserveMinusVirtual.toString(),
        threshold: threshold.toString(),
        diverged: assetDiverged,
      });

      if (assetDiverged) {
        diverged = true;
      }
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    const reportPath = path.join(
      OUTPUT_DIR,
      `pool-diverge-${poolAddress.slice(2, 10)}-${txVersion}.json`
    );
    await writeFile(
      reportPath,
      JSON.stringify(
        {
        pool_address: poolAddress,
        tx_version: txVersion,
        diverged,
        rule: "diverged when reserve - virtual_reserve >= 10^(decimals-1)",
        comparisons: rows,
      },
        null,
        2
      ) + "\n",
      "utf8"
    );
    console.log(`Wrote ${reportPath}`);

    return diverged;
  }

  if (txVersionArg) {
    console.log(`Single-pool explicit run: tx=${txVersionArg}`);
    await evaluateAtTx(txVersionArg);
    printBanner("FINISH");
    return;
  }

  let state = await readState();
  while (true) {
    const diff = state.upper - state.lower;
    if (diff <= 1n) {
      console.log(
        `Boundary reached: last_non_diverged=${state.lower.toString()} first_diverged=${state.upper.toString()}`
      );
      printBanner("DONE");
      break;
    }

    const txVersion = ((state.lower + state.upper) / 2n).toString();
    console.log(
      `Single-pool binary search: lower=${state.lower.toString()} upper=${state.upper.toString()} diff=${state.upper - state.lower}`
    );

    const diverged = await evaluateAtTx(txVersion);
    const median = BigInt(txVersion);
    // Boundary search invariant:
    // - lower is known non-diverged
    // - upper is known diverged
    // We move lower up on non-diverged samples, and upper down on diverged samples.
    const nextLower = diverged ? state.lower : median;
    const nextUpper = diverged ? median : state.upper;

    await writeState(nextLower, nextUpper);
    console.log(`Updated ${STATE_PATH} -> lower=${nextLower.toString()} upper=${nextUpper.toString()}`);
    printBanner("FINISH");
    state = { lower: nextLower, upper: nextUpper };
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
