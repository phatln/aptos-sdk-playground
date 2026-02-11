import * as fs from "fs";
import * as path from "path";

const INPUT_CSV = path.join(__dirname, "liquidity_txns.csv");
const OUTPUT_JSON = path.join(__dirname, "result.json");
const THRESHOLD = 4286956360n;

type Row = {
  position_idx: string;
  transaction_version: string;
  shares: string;
};

function parseCsvLines(content: string): string[][] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => line.split(","));
}

function main() {
  if (!fs.existsSync(INPUT_CSV)) {
    throw new Error(`Input CSV not found: ${INPUT_CSV}`);
  }

  const content = fs.readFileSync(INPUT_CSV, "utf8");
  const rows = parseCsvLines(content);
  if (rows.length === 0) {
    throw new Error("Input CSV is empty.");
  }

  const header = rows[0];
  const colIndex = (name: string) => {
    const idx = header.indexOf(name);
    if (idx === -1) throw new Error(`Missing column: ${name}`);
    return idx;
  };

  const txIdx = colIndex("transaction_version");
  const posIdx = colIndex("position_idx");
  const sharesIdx = colIndex("shares");

  const grouped = new Map<string, Row[]>();

  for (const row of rows.slice(1)) {
    const txStr = row[txIdx];
    if (!txStr) continue;
    const tx = BigInt(txStr);
    if (tx <= THRESHOLD) continue;

    const position_idx = row[posIdx];
    const shares = row[sharesIdx];
    if (!position_idx || !shares) continue;

    const entry: Row = {
      position_idx,
      transaction_version: txStr,
      shares,
    };

    const list = grouped.get(position_idx);
    if (list) list.push(entry);
    else grouped.set(position_idx, [entry]);
  }

  const sortedPositionKeys = Array.from(grouped.keys()).sort(
    (a, b) => Number(a) - Number(b)
  );

  const outputJson: Array<{
    position_idx: string;
    txs: Array<{ transaction_version: string; shares: string }>;
  }> = [];

  for (const key of sortedPositionKeys) {
    const groupRows = grouped.get(key) ?? [];
    groupRows.sort(
      (a, b) => BigInt(a.transaction_version) < BigInt(b.transaction_version) ? -1 : 1
    );

    outputJson.push({
      position_idx: key,
      txs: groupRows.map((r) => ({
        transaction_version: r.transaction_version,
        shares: r.shares,
      })),
    });
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(outputJson, null, 2), "utf8");
  console.log(`Wrote ${outputJson.length} groups to ${OUTPUT_JSON}`);
}

main();
