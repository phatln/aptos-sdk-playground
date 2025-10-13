import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';
import { buildTx } from './tx-builder';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function run() {
  let arg = [
    [
      "78",
      "216",
      "253",
      "162",
      "145",
      "182",
      "4",
      "73",
      "30",
      "173",
      "12",
      "201",
      "229",
      "35",
      "43",
      "193",
      "237",
      "193",
      "243",
      "29",
      "14",
      "12",
      "243",
      "67",
      "190",
      "4",
      "61",
      "140",
      "121",
      "42",
      "241",
      "168",
      "0",
      "128",
      "150",
      "152",
      "0",
      "0",
      "0",
      "0",
      "0",
      "72",
      "243",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "1",
      "184",
      "127",
      "255",
      "255",
      "255",
      "255",
      "255",
      "255",
      "112",
      "139",
      "255",
      "255",
      "255",
      "255",
      "255",
      "255"
    ]
  ];
  let bz = arg[0].map((v) => Number(v));

  const txn = await buildTx(
    aptos,
    account,
    "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a::router::add_liquidity",
    [ bz ]
  );

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