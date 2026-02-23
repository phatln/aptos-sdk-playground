import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';
import { buildTx, hexToBytes } from './tx-builder';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: process.env.NETWORK as Network }));
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function run() {
  let arg = [
    [
      "2",
      "2",
      "5",
      "175",
      "254",
      "84",
      "172",
      "118",
      "185",
      "132",
      "230",
      "177",
      "132",
      "27",
      "238",
      "148",
      "236",
      "120",
      "109",
      "133",
      "212",
      "205",
      "188",
      "146",
      "6",
      "10",
      "174",
      "70",
      "236",
      "247",
      "167",
      "160",
      "143",
      "125",
      "34",
      "167",
      "38",
      "15",
      "49",
      "199",
      "0",
      "69",
      "162",
      "81",
      "21",
      "4",
      "67",
      "142",
      "36",
      "33",
      "117",
      "184",
      "75",
      "218",
      "202",
      "226",
      "119",
      "202",
      "212",
      "15",
      "74",
      "4",
      "53",
      "62",
      "136",
      "72",
      "100",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "202",
      "154",
      "59",
      "0",
      "0",
      "0",
      "0",
      "0",
      "228",
      "11",
      "84",
      "2",
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

  // const txn = await buildTx(
  //   aptos,
  //   account,
  //   "0x3771f4c048bb98494d8ae0502a9f7d0326d84eee566d3b8e68e9f733892b35ba::router::create_pool_add_liquidity",
  //   arg,
  // )
  const txn = await buildTx(
    aptos,
    account,
    "0x456f3d13a66465b004aaa74e805363ca397c315f565551bdd6090f7d747c00ba::voter::claim_all",
    [
      AccountAddress.from("0xc7da2057cf882197941085d0af27ce474da3a911abe6d2ba3cecdb11dd792c76"),
      [
        AccountAddress.from("0x5e1b3a33ef68351b50456e924011c8a53fcc110644c8f80e0be2f10516fe4214")
      ],
      [
        [
          AccountAddress.from("0x7538e517af47371976af23a1052bc64172cc65a029d1ef75b453a33d520f0b7f"),
          AccountAddress.from("0x8c58fb7fd3ccb2d7bc079dcbf924567fccd385b24b0f8afbfdebf87dc671ba07")
        ]
      ],
      [
        [
          AccountAddress.from("0xb61f9f829842869968edba4b88f0cf785ac6729fd664f50c7be8c630fd2daebc")
        ]
      ]
    ]
  )

  const simulation = await aptos.transaction.simulate.simple({
    transaction: txn,
    options: {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true
    }
  });

  console.log(simulation);

  const senderAuthenticator = aptos.transaction.sign({
    signer: account,
    transaction: txn,
  });
  const submittedTransaction = await aptos.transaction.submit.simple({
    transaction: txn,
    senderAuthenticator,
  });

  const executedTransaction = await aptos.waitForTransaction({ transactionHash: submittedTransaction.hash });

  console.log(executedTransaction.hash);
}

run();
