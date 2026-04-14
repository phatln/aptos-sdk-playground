import * as dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import {
  DEFAULT_ENV_PATH,
  DEFAULT_POOL_LIST_PATH,
  DEFAULT_TX_VERSIONS_PATH,
  HOOK_TYPE_ALIAS,
  SPECIAL_ALIAS_POOL_ADDRESS,
} from "./constants";
import { createAptosClient, fetchPoolMetaSnapshot } from "./aptos";
import {
  ensurePoolMetaOutputDir,
  fileExists,
  poolMetaOutputPathForLedgerVersion,
  readLedgerVersions,
  readPoolSpecs,
  resolveExistingPath,
} from "./files";
import { jsonReplacer } from "./json";
import { parseArgs } from "./cli";
import { PoolSpec } from "./types";

dotenv.config({ path: DEFAULT_ENV_PATH });

function withHardcodedAliasPool(pools: PoolSpec[]): PoolSpec[] {
  const hasAlias = pools.some(
    (pool) => pool.poolAddress.trim().toLowerCase() === SPECIAL_ALIAS_POOL_ADDRESS
  );

  if (hasAlias) {
    return pools;
  }

  return [
    ...pools,
    {
      poolAddress: SPECIAL_ALIAS_POOL_ADDRESS,
      hookType: HOOK_TYPE_ALIAS,
      assets: [],
    },
  ];
}

async function main() {
  const { ledgerVersion, network, apiKey, poolListPath: cliPoolListPath, txVersionsPath: cliTxVersionsPath } =
    parseArgs();

  const poolListPath = await resolveExistingPath(cliPoolListPath, DEFAULT_POOL_LIST_PATH, "Pool list");
  const txVersionsPath = await resolveExistingPath(
    cliTxVersionsPath,
    DEFAULT_TX_VERSIONS_PATH,
    "Tx versions"
  );
  const pools = withHardcodedAliasPool(await readPoolSpecs(poolListPath));
  const ledgerVersions = ledgerVersion ? [ledgerVersion] : await readLedgerVersions(txVersionsPath);
  const aptos = createAptosClient(network, apiKey);

  await ensurePoolMetaOutputDir();

  for (const currentLedgerVersion of ledgerVersions) {
    const outputPath = poolMetaOutputPathForLedgerVersion(currentLedgerVersion);

    if (await fileExists(outputPath)) {
      console.log(`Cache hit: ${outputPath}`);
      continue;
    }

    const output = await fetchPoolMetaSnapshot(
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
