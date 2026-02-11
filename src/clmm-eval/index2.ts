import * as fs from "fs";
import * as path from "path";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const INPUT_JSON = path.join(__dirname, "result.json");
const OUTPUT_JSON = path.join(__dirname, "result_fees.json");
const POOL_ADDR =
  "0x4ed8fda291b604491ead0cc9e5232bc1edc1f31d0e0cf343be043d8c792af1a8";
const VIEW_FN =
  "0xf5840b576a3a6a42464814bc32ae1160c50456fb885c62be389b817e75b2a385::clmm_views::position_fee_owed";

const NETWORK =
  (process.env.APTOS_NETWORK as Network | undefined) ?? Network.MAINNET;
const FALLBACK_ADD_LIQ_VERSION = 4286956360n;

type InputTx = {
  transaction_version: string;
  shares: string;
};

type InputGroup = {
  position_idx: string;
  txs: InputTx[];
};

type OutputTx = InputTx & {
  fees_owed: any[];
};

type OutputGroup = {
  position_idx: string;
  txs: OutputTx[];
};

async function viewFeeOwed(
  aptos: Aptos,
  positionIdx: bigint,
  ledgerVersion: bigint
): Promise<[string, string]> {
  const [feeX, feeY] = await aptos.view<[string, string]>({
    payload: {
      function: VIEW_FN,
      typeArguments: [],
      functionArguments: [POOL_ADDR, positionIdx],
    },
    options: { ledgerVersion },
  });

  return [String(feeX), String(feeY)];
}

function loadInput(): InputGroup[] {
  if (!fs.existsSync(INPUT_JSON)) {
    throw new Error(`Input JSON not found: ${INPUT_JSON}`);
  }

  const raw = fs.readFileSync(INPUT_JSON, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Input JSON must be an array.");
  }
  return parsed as InputGroup[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadLastProcessedFromOutput(): string | null {
  if (!fs.existsSync(OUTPUT_JSON)) return null;
  const raw = fs.readFileSync(OUTPUT_JSON, "utf8").trim();
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const last = parsed[parsed.length - 1];
  if (last && typeof last.position_idx === "string") {
    return last.position_idx;
  }
  return null;
}

async function main() {
  const aptos = new Aptos(new AptosConfig({ network: NETWORK }));
  const input = loadInput();
  const lastProcessed = loadLastProcessedFromOutput();
  const startIndex =
    lastProcessed == null
      ? 0
      : Math.max(
          0,
          input.findIndex((g) => g.position_idx === lastProcessed) + 1
        );
  if (lastProcessed != null) {
    console.log(`Resuming after position_idx=${lastProcessed}`);
  }

  let existing: OutputGroup[] = [];
  if (fs.existsSync(OUTPUT_JSON)) {
    const raw = fs.readFileSync(OUTPUT_JSON, "utf8").trim();
    if (raw.length > 0) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed as OutputGroup[];
      } else {
        throw new Error(`Output JSON is not an array: ${OUTPUT_JSON}`);
      }
    }
  }

  for (const group of input.slice(startIndex)) {
    console.log(`Processing position_idx=${group.position_idx}`);
    const positionIdx = BigInt(group.position_idx);
    const outGroup: OutputGroup = {
      position_idx: group.position_idx,
      txs: [],
    };

    const hasOnlyOneRemove =
      group.txs.length === 1 && BigInt(group.txs[0].shares) < 0n;
    if (hasOnlyOneRemove) {
      group.txs = [
        {
          transaction_version: (FALLBACK_ADD_LIQ_VERSION - 1n).toString(),
          shares: (-BigInt(group.txs[0].shares)).toString()
        },
        group.txs[0]
      ];
    };

    for (const tx of group.txs) {
      const shares = BigInt(tx.shares);
      const txVersion = BigInt(tx.transaction_version);
      let ledgerVersion = shares > 0n ? txVersion : txVersion - 1n;

      const [feeX, feeY] = await viewFeeOwed(
        aptos,
        positionIdx,
        ledgerVersion
      );

      outGroup.txs.push({
        transaction_version: tx.transaction_version,
        shares: tx.shares,
        fees_owed: [feeX, feeY],
      });

      console.log(
        `  fee_owed fetched tx=${tx.transaction_version} ledger=${ledgerVersion.toString()}`
      );
      await sleep(2000);
    }

    existing.push(outGroup);
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(existing, null, 2), "utf8");
    console.log(`Wrote ${existing.length} groups to ${OUTPUT_JSON}`);
  }

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
