import { AccountAddress, createObjectAddress, createResourceAddress } from "@aptos-labs/ts-sdk";

export function deriveVaultAddress(packageHex: string): AccountAddress {
  const creatorAddress = AccountAddress.fromString(packageHex);
  return createResourceAddress(creatorAddress, "VAULT");
}

export function deriveCollectionAddress(packageHex: string): AccountAddress {
  const vaultAddress = deriveVaultAddress(packageHex);
  return createObjectAddress(vaultAddress, "TAPP");
}

// Example
// const pkg = "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a"; // TAPP package address
// console.log("vault:", deriveVaultAddress(pkg).toString());
// console.log("collection:", deriveCollectionAddress(pkg).toString());
