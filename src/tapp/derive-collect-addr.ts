import { AccountAddress } from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";

const RESOURCE_SCHEME = 0xff;
const OBJECT_FROM_SEED_SCHEME = 0xfe;
const textEncoder = new TextEncoder();

const concat = (...arrays: Uint8Array[]) => {
  const total = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
};

export function deriveVaultAddress(packageHex: string): AccountAddress {
  const creatorBytes = AccountAddress.fromString(packageHex).toUint8Array();
  const seed = textEncoder.encode("VAULT");
  const digest = sha3_256(concat(creatorBytes, seed, Uint8Array.of(RESOURCE_SCHEME)));
  return AccountAddress.from(digest);
}

export function deriveCollectionAddress(packageHex: string): AccountAddress {
  const vaultAddress = deriveVaultAddress(packageHex);
  const nameBytes = textEncoder.encode("TAPP");
  const digest = sha3_256(concat(vaultAddress.toUint8Array(), nameBytes, Uint8Array.of(OBJECT_FROM_SEED_SCHEME)));
  return AccountAddress.from(digest);
}

// Example
// const pkg = "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a"; // TAPP package address
// console.log("vault:", deriveVaultAddress(pkg).toString());
// console.log("collection:", deriveCollectionAddress(pkg).toString());
