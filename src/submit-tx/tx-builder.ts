import { Aptos, Ed25519Account, SimpleTransaction } from "@aptos-labs/ts-sdk";

const args = [
  [
    "203",
    "207",
    "205",
    "221",
    "129",
    "108",
    "160",
    "1",
    "190",
    "100",
    "247",
    "7",
    "59",
    "20",
    "205",
    "7",
    "199",
    "235",
    "151",
    "134",
    "185",
    "232",
    "22",
    "169",
    "61",
    "189",
    "74",
    "204",
    "40",
    "66",
    "227",
    "36",
    "1",
    "1",
    "64",
    "66",
    "15",
    "0",
    "0",
    "0",
    "0",
    "0",
    "5",
    "114",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "80",
    "59",
    "1",
    "0",
    "1",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0"
  ]
];

export async function buildTx(
  aptos: Aptos, 
  account: Ed25519Account,
  functionName: `${string}::${string}::${string}`,
  functionArgs: any[],
  typeArgs?: any[],
): Promise<SimpleTransaction> {
  const txn = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: functionName,
      functionArguments: functionArgs,
      typeArguments: typeArgs,
    },
  });

  return txn
}

export function hexToBytes(hexString: string) {
  // Convert hex string to byte array
  const bytes = Buffer.from(hexString, 'hex');
  const bzArr = Array.from(bytes);

  console.log(bzArr); // [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]
  return bzArr
}