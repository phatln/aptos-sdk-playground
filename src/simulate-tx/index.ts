import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import { buildTx } from "./tx-builder";

dotenv.config();

const aptos = new Aptos(new AptosConfig({ network: process.env.NETWORK as Network }));
const senderAddress = "0x892f70dc8acc15de6e43133b9095951c1049d6966793890ab478165475def1a6";
const functionName =
  "0x8a5ef085f2a8eb714c1462392d52371dfef0f97325d140b605e8306fafcf398b::voter::vote";
const functionArgs = [
  "0xed20702deee3aac62416aa29bc72feeff49be89597a53ef58486a85e941075e5",
  [
    "0x8f9dd0b94f1c18f96c00dfbff8254f20304f05713bb841d20b203f9446a75b9",
    "0x4ed8fda291b604491ead0cc9e5232bc1edc1f31d0e0cf343be043d8c792af1a8",
  ],
  ["50000", "50000"],
];

export async function run() {
  const txn = await buildTx(
    aptos,
    senderAddress,
    functionName,
    functionArgs as unknown as any[],
  );

  const [simulation] = await aptos.transaction.simulate.simple({
    transaction: txn,
    options: {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true,
    },
  });

  console.log(simulation);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
