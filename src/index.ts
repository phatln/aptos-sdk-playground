import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";
import { objectCodeUpgrade } from "./object_code_upgrade";

async function main() {
  await objectCodeUpgrade();
}

main().catch(console.error);