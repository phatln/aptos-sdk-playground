import * as dotenv from 'dotenv';
dotenv.config();

import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network, Serializer, U128, U256 } from '@aptos-labs/ts-sdk';

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function addStableLiquidity() {
  // const txData = sdk.Position.addStableLiquidity({
  //   poolId: '0x7afddbb8e75da1ea0a5c29b6d6a86eed64af25f708a068853def27e7d277a852',
  //   amounts: [1_00000000, 20000000000_00000000],
  // });

  console.log(account.accountAddress.toString());

  const ser = new Serializer();
  ser.serializeU8(1); // route num
  ser.serializeU8(0); // route type

  // route v3 exact in
  ser.serializeVector([
    AccountAddress.fromString('0xfb5b7bbb6547b0720f6e6d87d2b104dfaa13225aa93b1c81663b173d22f1647b'),
    // AccountAddress.fromString('0xc97cdc6c74adf6fa4e18cae1c4bc9abefa5a95f9a5ea93e864d7bb8d230012c2')
  ]); // pools
  ser.serialize(AccountAddress.fromString("0xb61f9f829842869968edba4b88f0cf785ac6729fd664f50c7be8c630fd2daebc")); // token in
  // ser.serialize(AccountAddress.fromString("0x7538e517af47371976af23a1052bc64172cc65a029d1ef75b453a33d520f0b7f")); // token out
  ser.serialize(AccountAddress.fromString("0x22a7260f31c70045a2511504438e242175b84bdacae277cad40f4a04353e8848")); // token out
  ser.serializeU64(1_0000n); // amount in
  ser.serializeU64(1n); // min amount out
  ser.serializeVector([
    new U128(17596135122294978210n),
  ]) // sqrt price list

  console.log(ser.toUint8Array().toString());

  const txn = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: '0x8e5a9978d9fa1393c0917fc2e788c460359c49b0a41af839bcd550b1b387dfcf::entry::execute_routes',
      functionArguments: [
        ser.toUint8Array(),
      ],
    },
  });

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

addStableLiquidity();

// Convert hex string to byte array
// const hexString = "676a9fa00b2a859bf4d08332b5c0efbaf9dbb33e0e99c051e5a3e7fefb301702000110270000000000000000000000000000ae331ba8327fbb35b1c4feff00000000";
// const bytes = Buffer.from(hexString, 'hex');
// console.log(Array.from(bytes)); // [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]