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
    "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a::router::remove_liquidity",
    [
      hexToBytes("0x4ed8fda291b604491ead0cc9e5232bc1edc1f31d0e0cf343be043d8c792af1a802ef07e6acd8c9f4063c75e20ed075e637be795d444753b6f44f555816fee8235fd401000000000000000000000000007c4c0000000000000000000000000000")
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
