import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config();

const MODULE_FUNCTION =
  "0xa611a8ba7261ed1f4d3afe4ac2166fc9f3180103e3296772d593a1e2720c7405::stable::claimable" as `${string}::${string}::${string}`;
const FIXED_TX_VERSION = 4411736842n;
const POSITIONS_FILE = path.resolve(process.cwd(), "src/view-claimable/positions.json");
const OUTPUT_FILE = path.resolve(process.cwd(), "src/view-claimable/claimable.json");

function parseArgs() {
  const [, , cliPoolAddress] = process.argv;
  const poolAddress = cliPoolAddress ?? process.env.POOL_ADDRESS;

  if (!poolAddress) {
    console.error("Usage: npm run view-claimable -- <pool_address> (or set POOL_ADDRESS in .env)");
    process.exit(1);
  }

  return { poolAddress };
}

function jsonReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function isMapKeyNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const data = (err as { data?: { message?: unknown } }).data;
  if (!data || typeof data.message !== "string") return false;
  return data.message.includes("EKEY_NOT_FOUND");
}

async function readPositionIndexes(): Promise<bigint[]> {
  const raw = await readFile(POSITIONS_FILE, "utf8");
  const textLines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const allNumericLines = textLines.every((line) => /^\d+$/.test(line));
  if (allNumericLines) {
    return textLines.map((line) => BigInt(line));
  }

  const tableIndexes = textLines
    .map((line) => line.match(/^(\d+)\s*\|/)?.[1])
    .filter((value): value is string => typeof value === "string");
  if (tableIndexes.length > 0) {
    return tableIndexes.map((value) => BigInt(value));
  }

  try {
    const parsed = JSON.parse(raw) as {
      root?: {
        children?: {
          entries?: Array<{ key?: string }>;
        };
      };
    };
    const entries = parsed.root?.children?.entries ?? [];

    return entries
      .map((entry) => entry.key)
      .filter((key): key is string => typeof key === "string")
      .map((key) => BigInt(key));
  } catch {
    throw new Error(
      `Unsupported positions format in ${POSITIONS_FILE}. Expected newline IDs, 'id | value' table rows, or JSON with root.children.entries[].key`
    );
  }
}

async function main() {
  const aptos = new Aptos(
    new AptosConfig({
      network: (process.env.NETWORK as Network) ?? Network.TESTNET,
    })
  );

  const { poolAddress } = parseArgs();
  const positionIndexes = await readPositionIndexes();

  const tx = await aptos.getTransactionByVersion({ ledgerVersion: FIXED_TX_VERSION });
  const txAny = tx as any;

  console.log("transaction at version:");
  console.dir(
    {
      version: txAny.version,
      hash: txAny.hash,
      type: txAny.type,
      success: txAny.success,
      vm_status: txAny.vm_status,
    },
    { depth: null }
  );

  const latestLedger = await aptos.getLedgerInfo();
  const results: Array<{
    position_idx: string;
    claimable_before: unknown;
    claimable_current: unknown;
  }> = [];

  for (const positionIdx of positionIndexes) {
    try {
      const [claimableBefore] = await aptos.view({
        payload: {
          function: MODULE_FUNCTION,
          typeArguments: [],
          functionArguments: [poolAddress, positionIdx],
        },
        options: { ledgerVersion: FIXED_TX_VERSION },
      });

      const [claimableCurrent] = await aptos.view({
        payload: {
          function: MODULE_FUNCTION,
          typeArguments: [],
          functionArguments: [poolAddress, positionIdx],
        },
      });

      results.push({
        position_idx: positionIdx.toString(),
        claimable_before: claimableBefore,
        claimable_current: claimableCurrent,
      });
    } catch (err) {
      if (isMapKeyNotFoundError(err)) {
        console.warn(`Skipping position ${positionIdx.toString()} (EKEY_NOT_FOUND)`);
        continue;
      }
      throw err;
    }
  }

  const output = {
    pool_address: poolAddress,
    source_positions_file: POSITIONS_FILE,
    fixed_tx_version: FIXED_TX_VERSION.toString(),
    latest_ledger_version: latestLedger.ledger_version,
    transaction_at_fixed_version: {
      version: txAny.version,
      hash: txAny.hash,
      type: txAny.type,
      success: txAny.success,
      vm_status: txAny.vm_status,
    },
    positions: results,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, jsonReplacer, 2) + "\n", "utf8");
  console.log(`Wrote ${results.length} positions to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
