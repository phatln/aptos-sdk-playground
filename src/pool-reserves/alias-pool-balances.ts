import * as dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import { DEFAULT_ENV_PATH } from "./constants";
import { createAptosClient, fetchAliasPoolSnapshot } from "./aptos";
import {
  aliasOutputPathForLedgerVersion,
  ensureAliasOutputDir,
  fileExists,
} from "./files";
import { jsonReplacer } from "./json";
import { parseArgs } from "./cli";

dotenv.config({ path: DEFAULT_ENV_PATH });

async function main() {
  const { ledgerVersion, network, apiKey } = parseArgs();

  if (!ledgerVersion) {
    throw new Error("Missing ledger version. Usage: npx ts-node src/pool-reserves/alias-pool-balances.ts <tx_version> [network]");
  }

  const aptos = createAptosClient(network, apiKey);
  const outputPath = aliasOutputPathForLedgerVersion(ledgerVersion);

  await ensureAliasOutputDir();

  if (await fileExists(outputPath)) {
    console.log(`Cache hit: ${outputPath}`);
    return;
  }

  const output = await fetchAliasPoolSnapshot(aptos, ledgerVersion, network);
  await writeFile(outputPath, JSON.stringify(output, jsonReplacer, 2) + "\n", "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
