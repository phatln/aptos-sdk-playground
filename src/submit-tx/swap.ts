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

export async function swapTx(aptos: Aptos, account: Ed25519Account): Promise<SimpleTransaction> {
  let bz = args[0].map((v) => Number(v));

  const txn = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: '0xd32e6ce3789e21aac32f8a7623994681f7235eac9f6d323ff0277295a9364b88::router::swap',
      functionArguments: [
        bz,
      ],
    },
  });

  return txn
}
