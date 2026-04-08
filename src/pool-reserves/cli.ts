import { Network } from "@aptos-labs/ts-sdk";
import { CliArgs } from "./types";

export function parseNetwork(input?: string): Network {
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

export function parseArgs(argv: string[] = process.argv): CliArgs {
  const [, , cliLedgerVersion, cliNetwork, cliPoolListPath, cliTxVersionsPath] = argv;
  const ledgerVersionInput = cliLedgerVersion ?? process.env.LEDGER_VERSION;
  const network = parseNetwork(cliNetwork ?? process.env.APTOS_NETWORK ?? process.env.NETWORK);
  const apiKey = process.env.APTOS_API_KEY ?? process.env.API_KEY;

  if (ledgerVersionInput && !/^\d+$/.test(ledgerVersionInput)) {
    throw new Error(`Invalid ledger version: ${ledgerVersionInput}`);
  }

  if (!apiKey) {
    throw new Error("Missing API key. Set APTOS_API_KEY or API_KEY in the environment.");
  }

  return {
    ledgerVersion: ledgerVersionInput ? BigInt(ledgerVersionInput) : undefined,
    network,
    apiKey,
    poolListPath: cliPoolListPath,
    txVersionsPath: cliTxVersionsPath,
  };
}
