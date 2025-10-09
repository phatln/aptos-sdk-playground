import { AccountAddress, Aptos, Ed25519Account, Serializer, U128, U64 } from "@aptos-labs/ts-sdk";

export async function executeRoutes(aptos: Aptos, account: Ed25519Account) {
  const ser = new Serializer();
  ser.serializeOption(new U64(60)); 
  // route type

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

  return txn
}