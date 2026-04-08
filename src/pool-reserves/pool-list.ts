import { Network } from "@aptos-labs/ts-sdk";
import { PoolType, initTappSDK } from "@tapp-exchange/sdk";
import * as dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: path.join(__dirname, ".env") });

const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_LIMIT = 30;
const OUTPUT_FILE = path.join(__dirname, "pools.json");

type PoolMeta = {
  pool_addr: string;
  hook_type: number;
  hook_type_label: "V2" | "V3" | "STABLE";
  assets: string[];
  tokens: Array<{
    addr: string;
    amount: string;
    img: string;
    reserve: string;
    symbol: string;
    verified: boolean;
  }>;
  assets_display: string;
  tvl: number;
  reserves: string[];
  reserves_display: string;
};

type CliArgs = {
  network: Network.MAINNET | Network.TESTNET;
  pageSize: number;
  limit: number;
};

function parseNetwork(input?: string): Network.MAINNET | Network.TESTNET {
  const normalized = input?.trim().toLowerCase() ?? Network.MAINNET;

  if (normalized === Network.TESTNET) {
    return Network.TESTNET;
  }

  if (normalized === Network.MAINNET) {
    return Network.MAINNET;
  }

  throw new Error(`Unsupported network: ${input}`);
}

function parsePositiveInteger(name: string, input: string | undefined, fallback: number): number {
  if (input === undefined || input.trim() === "") {
    return fallback;
  }

  if (!/^\d+$/.test(input)) {
    throw new Error(`Invalid ${name}: ${input}`);
  }

  const value = Number(input);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: ${input}`);
  }

  return value;
}

function parseArgs(): CliArgs {
  const [, , cliLimit, cliPageSize, cliNetwork] = process.argv;

  return {
    network: parseNetwork(cliNetwork ?? process.env.APTOS_NETWORK ?? process.env.NETWORK),
    limit: parsePositiveInteger("limit", cliLimit ?? process.env.POOL_LIST_LIMIT, DEFAULT_LIMIT),
    pageSize: parsePositiveInteger(
      "page size",
      cliPageSize ?? process.env.POOL_LIST_PAGE_SIZE,
      DEFAULT_PAGE_SIZE
    ),
  };
}

function formatNumber8(input: string | number): string {
  const numericValue = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(numericValue);
}

function mapPoolType(poolType: PoolType): Pick<PoolMeta, "hook_type" | "hook_type_label"> {
  if (poolType === PoolType.CLMM) {
    return { hook_type: 3, hook_type_label: "V3" };
  }

  if (poolType === PoolType.STABLE) {
    return { hook_type: 4, hook_type_label: "STABLE" };
  }

  return { hook_type: 2, hook_type_label: "V2" };
}

async function fetchPools({ network, pageSize, limit }: CliArgs): Promise<PoolMeta[]> {
  const tappSdk = initTappSDK({ network });
  const pools: PoolMeta[] = [];

  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (pools.length < total && pools.length < limit) {
    const result = await tappSdk.Pool.getPools({
      page,
      size: pageSize,
      sortBy: "tvl",
    });

    const pagePools = (result.data ?? []).map((pool) => {
      const assets = pool.tokens?.map((token) => token.addr).filter(Boolean) ?? [];
      const assetsSymbol = pool.tokens?.map((token) => token.symbol).filter(Boolean) ?? [];
      const reserves = pool.tokens?.map((token) => token.reserve) ?? [];
      const { hook_type, hook_type_label } = mapPoolType(pool.poolType);

      return {
        pool_addr: pool.poolId,
        hook_type,
        hook_type_label,
        assets,
        tokens: pool.tokens ?? [],
        assets_display: assetsSymbol.length > 0 ? assetsSymbol.join(", ") : "unknown",
        tvl: Number(pool.tvl) || 0,
        reserves,
        reserves_display: `[${reserves.map((value) => formatNumber8(value)).join(", ")}]`,
      };
    });

    total = Number.isFinite(result.total) ? result.total : pagePools.length;
    pools.push(...pagePools);

    if (pagePools.length === 0) {
      break;
    }

    page += 1;
  }

  return pools.slice(0, limit);
}

async function main() {
  const args = parseArgs();
  const pools = await fetchPools(args);

  const output = {
    network: args.network,
    limit: args.limit,
    page_size: args.pageSize,
    fetched_at: new Date().toISOString(),
    pools,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${pools.length} pools to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
