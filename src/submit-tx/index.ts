import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';
import { buildTx } from './tx-builder';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
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
    "0x70f01f95703437028440812d10f65a55372deb9d336e245bf3120db7aadb4c5f::ve::gauge_uncommit",
    [
      AccountAddress.from("0x4a281080bf0226c0a1d3bf3827d561982d5143ee4fa36f6a2be7c5109f84b9fb"),
      AccountAddress.from("0x0f1a16521bf6cb902fc57ef72051dc88026f589e1e413cf1e739b300fcc42d86"),
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

// Convert hex string to byte array
// const hexString = "676a9fa00b2a859bf4d08332b5c0efbaf9dbb33e0e99c051e5a3e7fefb301702000110270000000000000000000000000000ae331ba8327fbb35b1c4feff00000000";
// const bytes = Buffer.from(hexString, 'hex');
// console.log(Array.from(bytes)); // [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]