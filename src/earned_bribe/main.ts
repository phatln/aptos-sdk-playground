import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config();

const VIEW_FUNCTION =
  "0x296a63c4074a1e7475e394db6a5b099755481f9c16d2c19237f82cc80d0e2486::bribe_voting_reward::earned" as const;
const POOL_ADDR =
  "0xb5afb711ef141908e5a11c42aae6cb4b08ee4bcf1d5a9961cd882d52b53bd1ec";
const REWARD_ADDR =
  "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b";
const LOCKS_PATH = path.join(__dirname, "locks.json");
const OUTPUT_DIR = __dirname;

type LocksJson = Record<string, number | string>;

type EarnedResult = {
  token_addr: string;
  lock_amount: string;
  earned: string;
};

function parseNetwork(input?: string): Network {
  if (input === undefined || input.trim() === "") {
    return Network.MAINNET;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized === Network.MAINNET) return Network.MAINNET;
  if (normalized === Network.TESTNET) return Network.TESTNET;
  if (normalized === Network.DEVNET) return Network.DEVNET;
  if (normalized === Network.LOCAL) return Network.LOCAL;
  if (normalized === Network.CUSTOM) return Network.CUSTOM;

  throw new Error(`Unsupported network: ${input}`);
}

function parseArgs() {
  const [, , txVersionArg] = process.argv;

  if (txVersionArg && !/^\d+$/.test(txVersionArg)) {
    throw new Error("Usage: npx ts-node src/earned_bribe/main.ts [tx_version]");
  }

  return {
    txVersion: txVersionArg ? BigInt(txVersionArg) : undefined,
  };
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function normalizeAddress(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]+$/.test(trimmed)) {
    throw new Error(`Invalid address: ${value}`);
  }
  return `0x${trimmed.slice(2).padStart(64, "0")}`;
}

async function readLocks(): Promise<Array<{ tokenAddr: string; lockAmount: string }>> {
  const raw = await readFile(LOCKS_PATH, "utf8");
  const parsed = JSON.parse(raw) as LocksJson;

  const entries = Object.entries(parsed).map(([tokenAddr, lockAmount]) => ({
    tokenAddr: normalizeAddress(tokenAddr),
    lockAmount: String(lockAmount),
  }));

  if (entries.length === 0) {
    throw new Error(`No token addresses found in ${LOCKS_PATH}`);
  }

  return entries;
}

async function main() {
  const { txVersion: cliTxVersion } = parseArgs();
  const network = parseNetwork(process.env.APTOS_NETWORK ?? process.env.NETWORK);
  const apiKey = process.env.APTOS_API_KEY ?? process.env.API_KEY;
  console.log(apiKey);
  
  const aptos = new Aptos(
    new AptosConfig({
      network,
      clientConfig: apiKey
        ? {
            API_KEY: apiKey,
          }
        : undefined,
    })
  );

  const ledgerInfo = cliTxVersion ? undefined : await aptos.getLedgerInfo();
  const txVersion = cliTxVersion ?? BigInt(ledgerInfo!.ledger_version);
  const locks = await readLocks();
  const results: EarnedResult[] = [];

  console.log(`Querying ${locks.length} token(s) at tx_version=${txVersion.toString()} on ${network}`);

  for (const lock of locks) {
    try {
      const [earned] = await aptos.view<[string | number | bigint]>({
        payload: {
          function: VIEW_FUNCTION,
          typeArguments: [],
          functionArguments: [POOL_ADDR, lock.tokenAddr, REWARD_ADDR],
        },
        options: { ledgerVersion: txVersion },
      });

      results.push({
        token_addr: lock.tokenAddr,
        lock_amount: lock.lockAmount,
        earned: String(earned),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed token=${lock.tokenAddr} tx_version=${txVersion.toString()}: ${message}`);
      results.push({
        token_addr: lock.tokenAddr,
        lock_amount: lock.lockAmount,
        earned: "N/A",
      });
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `earned-${txVersion.toString()}.csv`);
  const lines = [
    ["token_addr", "lock_amount", "earned"].map(csvCell).join(","),
    ...results.map((result) =>
      [result.token_addr, result.lock_amount, result.earned]
        .map((value) => csvCell(String(value)))
        .join(",")
    ),
  ];

  await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
