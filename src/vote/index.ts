import { readFileSync } from "fs";
import { join } from "path";

const eventsPath = join(__dirname, "events.json");

type VoteEvent = {
  type?: string;
  data?: {
    pool?: string;
    weight?: string;
  };
};

type ParsedVoteEvent = {
  type: string;
  data: {
    pool: string;
    weight: string;
  };
};

function isVoteEvent(event: VoteEvent): event is ParsedVoteEvent {
  return (
    typeof event?.type === "string" &&
    event.type.includes("::voter::Voted") &&
    typeof event?.data?.pool === "string" &&
    typeof event?.data?.weight === "string"
  );
}

function formatPercent(weight: bigint, total: bigint, decimals = 4): string {
  if (total === 0n) return "0";
  const scale = 10n ** BigInt(decimals);
  const scaled = (weight * 100n * scale) / total; // percent * scale
  const intPart = scaled / scale;
  const fracPart = scaled % scale;
  const fracStr = fracPart.toString().padStart(decimals, "0");
  return `${intPart.toString()}.${fracStr}`;
}

const raw = readFileSync(eventsPath, "utf8");
const events: VoteEvent[] = JSON.parse(raw);

const weightsByPool = new Map<string, bigint>();

for (const event of events) {
  if (!isVoteEvent(event)) continue;
  const pool = event.data.pool;
  const weight = BigInt(event.data.weight);
  weightsByPool.set(pool, (weightsByPool.get(pool) ?? 0n) + weight);
}

const totalWeight = Array.from(weightsByPool.values()).reduce(
  (acc, w) => acc + w,
  0n
);

const rows = Array.from(weightsByPool.entries())
  .sort((a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0))
  .map(([pool, weight]) => ({
    pool,
    weight: weight.toString(),
    percent: formatPercent(weight, totalWeight),
  }));

console.log(
  JSON.stringify(
    {
      totalWeight: totalWeight.toString(),
      poolCount: rows.length,
      pools: rows,
    },
    null,
    2
  )
);
