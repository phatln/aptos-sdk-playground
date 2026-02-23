import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, Network, Serializer } from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: process.env.NETWORK as Network }));
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY!),
});

async function run() {
  console.log("amm");
  let ser = new Serializer();
  ser.serializeU8(0xa1);
  ser.serializeU64(3333000000)
  console.log(ser.toUint8Array());

  console.log("clmm");
  ser = new Serializer();
  ser.serializeU8(0xa2);
  ser.serializeU64(333300)
  console.log(ser.toUint8Array());

  console.log("stable");
  ser = new Serializer();
  ser.serializeU8(0xa5);
  ser.serializeU64(3333_000_000)
  console.log(ser.toUint8Array());
}

run()