import * as dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import {
  DEFAULT_ENV_PATH,
  DEFAULT_POOL_LIST_PATH,
  DEFAULT_TX_VERSIONS_PATH,
} from "./constants";
import { createAptosClient, fetchLedgerSnapshot } from "./aptos";
import {
  ensureOutputDir,
  fileExists,
  outputPathForLedgerVersion,
  readLedgerVersions,
  readPoolSpecs,
  resolveExistingPath,
} from "./files";
import { jsonReplacer } from "./json";
import { parseArgs } from "./cli";

dotenv.config({ path: DEFAULT_ENV_PATH });

async function main() {
  const { ledgerVersion, network, apiKey, poolListPath: cliPoolListPath, txVersionsPath: cliTxVersionsPath } =
    parseArgs();

  const poolListPath = await resolveExistingPath(cliPoolListPath, DEFAULT_POOL_LIST_PATH, "Pool list");
  const txVersionsPath = await resolveExistingPath(
    cliTxVersionsPath,
    DEFAULT_TX_VERSIONS_PATH,
    "Tx versions"
  );
  const pools = await readPoolSpecs(poolListPath);
  const ledgerVersions = ledgerVersion ? [ledgerVersion] : await readLedgerVersions(txVersionsPath);

  const aptos = createAptosClient(network, apiKey);

  await ensureOutputDir();

  for (const currentLedgerVersion of ledgerVersions) {
    const outputPath = outputPathForLedgerVersion(currentLedgerVersion);

    if (await fileExists(outputPath)) {
      console.log(`Cache hit: ${outputPath}`);
      continue;
    }

    const output = await fetchLedgerSnapshot(
      aptos,
      currentLedgerVersion,
      pools,
      network,
      poolListPath
    );

    await writeFile(outputPath, JSON.stringify(output, jsonReplacer, 2) + "\n", "utf8");
    console.log(`Wrote ${outputPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
