import { Network } from "@aptos-labs/ts-sdk";
import path from "node:path";

export const DEFAULT_POOL_LIST_PATH = path.join(__dirname, "pools.json");
export const DEFAULT_TX_VERSIONS_PATH = path.join(__dirname, "tx-versions.md");
export const DEFAULT_ENV_PATH = path.join(__dirname, ".env");
export const OUTPUT_DIR = path.join(__dirname, "pool-reserves");
export const POOL_META_OUTPUT_DIR = path.join(__dirname, "pool-meta-reserves");

export const PRIMARY_FUNGIBLE_STORE_BALANCE_FUNCTION =
  "0x1::primary_fungible_store::balance" as const;
export const VIEWS_PACKAGE_ADDRESS =
  "0xf5840b576a3a6a42464814bc32ae1160c50456fb885c62be389b817e75b2a385";
export const SPECIAL_ALIAS_POOL_ADDRESS =
  "0x92b0e7194ae1b55cc2b55c127dac4c6a37a832a10bea4f68f02855f997ae3066";
export const GET_POOL_META_VIEW_FN =
  `${VIEWS_PACKAGE_ADDRESS}::tapp_views::get_pool_meta` as const;

export const HOOK_TYPE_ALIAS = 1;
export const HOOK_TYPE_AMM = 2;
export const HOOK_TYPE_CLMM = 3;
export const HOOK_TYPE_STABLE = 4;

export type PackageAddresses = {
  tappPackageAddress: string;
};

const MAINNET_PACKAGE_ADDRESSES: PackageAddresses = {
  tappPackageAddress: "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a",
};

export function getPackageAddresses(network: Network): PackageAddresses {
  if (network === Network.MAINNET) {
    return MAINNET_PACKAGE_ADDRESSES;
  }

  throw new Error(`Unsupported network for pool reserve fetcher: ${network}`);
}
