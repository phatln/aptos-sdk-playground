import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { swapTx } from './swap';
import * as dotenv from 'dotenv';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function run() {
  const txn = await swapTx(aptos, account);

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