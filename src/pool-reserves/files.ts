import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { OUTPUT_DIR } from "./constants";
import { PoolListFile, PoolSpec } from "./types";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveExistingPath(
  cliPath: string | undefined,
  defaultPath: string,
  label: string
): Promise<string> {
  const resolvedPath = cliPath ? path.resolve(process.cwd(), cliPath) : defaultPath;

  if (await fileExists(resolvedPath)) {
    return resolvedPath;
  }

  throw new Error(`${label} file not found: ${resolvedPath}`);
}

export async function readPoolSpecs(poolListPath: string): Promise<PoolSpec[]> {
  const raw = await readFile(poolListPath, "utf8");
  const parsed = JSON.parse(raw) as PoolListFile;
  const poolSpecs =
    parsed.pools
      ?.map((pool) => ({
        poolAddress: pool.pool_addr?.trim(),
        hookType: pool.hook_type,
        assets: Array.isArray(pool.assets)
          ? pool.assets
              .map((asset) => (typeof asset === "string" ? asset.trim() : ""))
              .filter((asset) => asset.length > 0)
          : [],
      }))
      .filter(
        (pool): pool is PoolSpec =>
          typeof pool.poolAddress === "string" &&
          pool.poolAddress.length > 0 &&
          typeof pool.hookType === "number" &&
          pool.assets.length > 0
      ) ?? [];

  if (poolSpecs.length === 0) {
    throw new Error(`No usable pool specs found in ${poolListPath}`);
  }

  return poolSpecs;
}

export async function readLedgerVersions(txVersionsPath: string): Promise<bigint[]> {
  const raw = await readFile(txVersionsPath, "utf8");
  const matches = raw.match(/\b\d+\b/g) ?? [];
  const versions = matches.map((value) => BigInt(value));

  if (versions.length === 0) {
    throw new Error(`No tx versions found in ${txVersionsPath}`);
  }

  return versions;
}

export async function ensureOutputDir(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

export function outputPathForLedgerVersion(ledgerVersion: bigint): string {
  return path.join(OUTPUT_DIR, `pool-${ledgerVersion.toString()}.json`);
}
